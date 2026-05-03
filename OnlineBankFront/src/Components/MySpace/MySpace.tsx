import React, { useEffect, useState } from "react";
import "./MySpace.scss";

interface VirtualCard {
  id: string;
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv: string;
  nickname: string;
  isActive: boolean;
  network: string;
  issuedAt: string;
  currentDailySpent: number;
}

interface WalletBalance {
  currency: string;
  balance: number;
}

interface Wallet {
  id: string;
  userId: string;
  balances: WalletBalance[];
}

interface UserProfile {
  fullName: string;
  email: string;
  currency: string;
  createdAt: string;
}

interface SpendingDay {
  label: string;
  date: string;
  amount: number;
}

const API_BASE = "https://localhost:7096/api";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥",
  CHF: "Fr", CAD: "CA$", AUD: "A$", INR: "₹", KRW: "₩",
  GEL: "₾", TRY: "₺", RUB: "₽", BRL: "R$", MXN: "MX$",
  SEK: "kr", NOK: "kr", DKK: "kr", PLN: "zł", ZAR: "R",
  SGD: "S$", HKD: "HK$", AED: "د.إ",
};

function currencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code.toUpperCase()] ?? code;
}

function getToken(): string | null {
  return localStorage.getItem("token");
}

function formatCardNumber(raw: string): string {
  return raw.replace(/(.{4})/g, "$1 ").trim();
}

function maskCardNumber(raw: string): string {
  return "**** **** **** " + raw.slice(-4);
}

async function apiFetch<T>(
  path: string,
  token: string,
  method: "GET" | "POST" = "GET"
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `Request failed: ${path} (${res.status})`);
  }
  return res.json();
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${cp} ${pts[i - 1].y} ${cp} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

function SpendingChart({ token, symbol }: { token: string; symbol: string }) {
  const [data, setData] = useState<SpendingDay[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    apiFetch<SpendingDay[]>("/VirtualCard/spending-week", token)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setChartLoading(false));
  }, [token]);

  if (chartLoading) {
    return (
      <div className="spending-chart spending-chart--loading">
        <div className="pulse-ring-sm" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="spending-chart spending-chart--empty">
        <span>No spending data</span>
      </div>
    );
  }

  const W = 380;
  const H = 200;
  const pad = { top: 28, right: 12, bottom: 40, left: 50 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const maxVal = Math.max(...data.map((d) => d.amount), 10);
  const todayIdx = data.length - 1;

  const pts = data.map((d, i) => ({
    x: pad.left + (i / (data.length - 1)) * plotW,
    y: pad.top + plotH - (d.amount / maxVal) * plotH,
    ...d,
  }));

  const linePath = smoothPath(pts.map((p) => ({ x: p.x, y: p.y })));
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pad.top + plotH} L ${pts[0].x} ${pad.top + plotH} Z`;
  const today = pts[todayIdx];
  const yesterday = pts[todayIdx - 1];
  const trendUp = today.amount > (yesterday?.amount ?? 0);
  const trendPct =
    yesterday?.amount && yesterday.amount > 0
      ? Math.abs(((today.amount - yesterday.amount) / yesterday.amount) * 100).toFixed(1)
      : null;

  return (
    <div className="spending-chart">
      <div className="chart-header">
        <span className="chart-title">Daily Spending</span>
        <div className={`chart-trend ${trendUp ? "up" : "down"}`}>
          <svg viewBox="0 0 10 10" fill="currentColor">
            {trendUp ? <polygon points="5,1 9,9 1,9" /> : <polygon points="5,9 9,1 1,1" />}
          </svg>
          {trendPct ? `${trendPct}%` : "Today"}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e5a0" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00e5a0" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00c282" />
            <stop offset="100%" stopColor="#00e5a0" />
          </linearGradient>
        </defs>

        {[0, 0.33, 0.66, 1].map((t, i) => (
          <line key={i} x1={pad.left} y1={pad.top + plotH * t} x2={pad.left + plotW} y2={pad.top + plotH * t} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}

        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={i === todayIdx ? 5 : 3} fill={i === todayIdx ? "#00e5a0" : "rgba(0,229,160,0.45)"} />
            {i === todayIdx && <circle cx={p.x} cy={p.y} r={9} fill="none" stroke="#00e5a0" strokeWidth="1" opacity="0.35" />}
          </g>
        ))}

        <text x={today.x} y={today.y - 14} textAnchor="middle" fill="#00e5a0" fontSize="11" fontWeight="700">
          {symbol}{today.amount.toFixed(2)}
        </text>

        {pts.map((p, i) => (
          <text key={i} x={p.x} y={H - 6} textAnchor="middle" fill="#6b8a7a" fontSize="10">{p.label}</text>
        ))}

        {[0, 0.5, 1].map((t, i) => (
          <text key={i} x={pad.left - 8} y={pad.top + plotH * (1 - t) + 4} textAnchor="end" fill="#6b8a7a" fontSize="9">
            {symbol}{(maxVal * t).toFixed(0)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function WalletSection({ wallet, token }: { wallet: Wallet; token: string }) {
  const [view, setView] = useState<"total" | "breakdown">("total");
  const [totalUsd, setTotalUsd] = useState<number | null>(null);
  const [totalLoading, setTotalLoading] = useState(false);

  useEffect(() => {
    if (view !== "total") return;
    setTotalLoading(true);
    apiFetch<{ totalUsd: number }>("/Wallet/total-usd", token)
      .then((r) => setTotalUsd(r.totalUsd))
      .catch(() => {
        const fallback = wallet.balances.find((b) => b.currency === "USD")?.balance ?? 0;
        setTotalUsd(fallback);
      })
      .finally(() => setTotalLoading(false));
  }, [view, wallet]);

  const displayTotal = totalUsd ?? 0;
  const totalInt = Math.floor(displayTotal);
  const totalDec = (displayTotal % 1).toFixed(2).slice(2);

  return (
    <section className="myspace__balance">
      <div className="balance-top">
        <p className="balance-label">Wallet Balance</p>
        <div className="balance-toggle">
          <button
            className={`balance-toggle-btn ${view === "total" ? "active" : ""}`}
            onClick={() => setView("total")}
          >
            Total
          </button>
          <button
            className={`balance-toggle-btn ${view === "breakdown" ? "active" : ""}`}
            onClick={() => setView("breakdown")}
          >
            Currencies
          </button>
        </div>
      </div>

      {view === "total" ? (
        <>
          {totalLoading ? (
            <div className="balance-loading">
              <div className="pulse-ring-sm" />
              <span>Calculating total…</span>
            </div>
          ) : (
            <div className="balance-amount">
              <span className="balance-currency">$</span>
              <span className="balance-int">{totalInt.toLocaleString()}</span>
              <span className="balance-dec">.{totalDec}</span>
            </div>
          )}
          <p className="balance-sub">Total · Converted to USD</p>
        </>
      ) : (
        <div className="balance-breakdown">
          {wallet.balances.length === 0 ? (
            <span className="balance-breakdown-empty">No balances</span>
          ) : (
            wallet.balances.map((b) => (
              <div key={b.currency} className="balance-breakdown-row">
                <div className="balance-breakdown-left">
                  <span className="balance-breakdown-code">{b.currency}</span>
                </div>
                <span className="balance-breakdown-amount">
                  {currencySymbol(b.currency)}{b.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

export default function MySpace() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [virtualCard, setVirtualCard] = useState<VirtualCard | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [renewLoading, setRenewLoading] = useState(false);
  const [renewMsg, setRenewMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const token = getToken();

  useEffect(() => {
    if (!token) {
      setErrors(["Not authenticated. Please log in."]);
      setLoading(false);
      return;
    }

    const collected: string[] = [];

    Promise.allSettled([
      apiFetch<Wallet>("/Wallet", token).then(setWallet),
      apiFetch<VirtualCard[]>("/VirtualCard", token).then((cards) => {
        setVirtualCard(Array.isArray(cards) ? cards[0] ?? null : (cards as unknown as VirtualCard));
      }),
      apiFetch<UserProfile>("/User/profile", token).then(setUser),
    ]).then((results) => {
      results.forEach((r) => {
        if (r.status === "rejected") collected.push((r.reason as Error).message);
      });
      if (collected.length) setErrors(collected);
      setLoading(false);
    });
  }, []);

  async function handleRenewPin() {
    if (!virtualCard || !token) return;
    setRenewLoading(true);
    setRenewMsg(null);
    try {
      await apiFetch<{ message: string }>(`/VirtualCard/${virtualCard.id}/renew-pin`, token, "POST");
      setRenewMsg({ text: "New PIN sent to your email.", ok: true });
    } catch (e) {
      setRenewMsg({ text: (e as Error).message, ok: false });
    } finally {
      setRenewLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="myspace-loading">
        <div className="pulse-ring" />
        <span>Loading your space…</span>
      </div>
    );
  }

  if (errors.length && !wallet && !virtualCard && !user) {
    return (
      <div className="myspace-error">
        {errors.map((e, i) => <span key={i}>{e}</span>)}
      </div>
    );
  }

  return (
    <div className="myspace">
      <div className="myspace__ambient" aria-hidden="true">
        <div className="ambient-orb ambient-orb--1" />
        <div className="ambient-orb ambient-orb--2" />
        <div className="ambient-grid" />
      </div>

      <div className="myspace__inner">
        <header className="myspace__header">
          <div className="myspace__greeting">
            <p className="greeting-label">Good day,</p>
            <h1 className="greeting-name">{user?.fullName ?? "User"}</h1>
          </div>
          <div className="myspace__status">
            <span className={`status-dot ${virtualCard?.isActive ? "active" : ""}`} />
            <span className="status-text">
              {virtualCard?.isActive ? "Account Active" : "Inactive"}
            </span>
          </div>
        </header>

        {wallet && token && <WalletSection wallet={wallet} token={token} />}

        <div className="myspace__content-grid">
          {virtualCard && (
            <section className="myspace__card-section">
              <div className="card-section-header">
                <h2 className="card-section-title">Virtual Card</h2>
                <span className="card-network-badge">{virtualCard.network}</span>
              </div>

              <div
                className={`vcard-scene ${flipped ? "flipped" : ""}`}
                onClick={() => setFlipped((f) => !f)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setFlipped((f) => !f)}
                aria-label="Flip card to see CVV"
              >
                <div className="vcard vcard--front">
                  <div className="vcard__chip">
                    <div className="chip-line" />
                    <div className="chip-line" />
                    <div className="chip-line" />
                  </div>
                  <div className="vcard__network">{virtualCard.network}</div>
                  <div className="vcard__number">
                    {showCardNumber ? formatCardNumber(virtualCard.cardNumber) : maskCardNumber(virtualCard.cardNumber)}
                  </div>
                  <div className="vcard__footer">
                    <div className="vcard__holder">
                      <span className="vcard__meta-label">Card Holder</span>
                      <span className="vcard__meta-value">{virtualCard.cardHolderName}</span>
                    </div>
                    <div className="vcard__expiry">
                      <span className="vcard__meta-label">Expires</span>
                      <span className="vcard__meta-value">{virtualCard.expiryDate}</span>
                    </div>
                  </div>
                  <div className="vcard__glow" aria-hidden="true" />
                </div>

                <div className="vcard vcard--back">
                  <div className="vcard__strip" />
                  <div className="vcard__cvv-wrap">
                    <span className="vcard__meta-label">CVV</span>
                    <span className="vcard__cvv-value">{showCvv ? virtualCard.cvv : "•••"}</span>
                    <button className="cvv-toggle" onClick={(e) => { e.stopPropagation(); setShowCvv((s) => !s); }}>
                      {showCvv ? "Hide" : "Reveal"}
                    </button>
                  </div>
                  <p className="vcard__back-note">Click card to flip back</p>
                  <div className="vcard__glow" aria-hidden="true" />
                </div>
              </div>

              <p className="vcard-hint">Tap card to flip · See CVV on back</p>

              <div className="vcard-controls">
                <button className="vcard-btn" onClick={() => setShowCardNumber((s) => !s)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    {showCardNumber ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                  {showCardNumber ? "Hide Number" : "Show Number"}
                </button>

                <button className="vcard-btn vcard-btn--secondary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  {virtualCard.nickname}
                </button>
              </div>

              <button className="renew-pin-btn" onClick={handleRenewPin} disabled={renewLoading}>
                {renewLoading ? <div className="pulse-ring-sm" /> : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10" />
                    <path d="M22 12l-3-3-3 3" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                )}
                {renewLoading ? "Sending…" : "Renew PIN"}
              </button>

              {renewMsg && (
                <p className={`renew-pin-msg ${renewMsg.ok ? "ok" : "err"}`}>{renewMsg.text}</p>
              )}
            </section>
          )}

          <section className="myspace__chart-section">
            {token && <SpendingChart token={token} symbol="$" />}
          </section>
        </div>

        <section className="myspace__meta">
          <div className="meta-item">
            <span className="meta-label">Email</span>
            <span className="meta-value">{user?.email ?? "—"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Member since</span>
            <span className="meta-value">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "—"}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Card status</span>
            <span className={`meta-value meta-value--status ${virtualCard?.isActive ? "active" : ""}`}>
              {virtualCard ? (virtualCard.isActive ? "Active" : "Inactive") : "—"}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Issued</span>
            <span className="meta-value">
              {virtualCard?.issuedAt ? new Date(virtualCard.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}