import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./StockPage.scss";

const BASE_URL = "https://localhost:7096/api";

type Period = "1D" | "1W" | "1M" | "1Y";
type Tab = "buy" | "sell";

const PERIOD_CONFIG: Record<Period, { resolution: string; seconds: number }> = {
  "1D": { resolution: "5",  seconds: 86400 },
  "1W": { resolution: "60", seconds: 604800 },
  "1M": { resolution: "D",  seconds: 2592000 },
  "1Y": { resolution: "W",  seconds: 31536000 },
};

interface StockQuote {
  symbol: string;
  currentPrice: number;
  change: number;
  percentChange: number;
  highPrice: number;
  lowPrice: number;
  openPrice: number;
  previousClose: number;
}

interface Holding {
  symbol: string;
  companyName: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

interface WalletBalance {
  currency: string;
  balance: number;
}

function fmt(n: number) {
  return n?.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n?.toFixed(2)}%`;
}

function Sparkline({ prices, positive }: { prices: number[]; positive: boolean }) {
  const W = 600;
  const H = 160;
  const pad = 8;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const pts = prices.map((p, i) => {
    const x = pad + (i / (prices.length - 1)) * (W - pad * 2);
    const y = H - pad - ((p - min) / range) * (H - pad * 2);
    return [x, y] as [number, number];
  });

  const linePath = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1][0].toFixed(1)},${(H - pad).toFixed(1)} L${pts[0][0].toFixed(1)},${(H - pad).toFixed(1)} Z`;
  const color = positive ? "#00e5a0" : "#ff6b6b";
  const last = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="sp-chart">
      <defs>
        <linearGradient id="sp-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((t, i) => (
        <line key={i} x1={pad} y1={pad + (H - pad * 2) * t} x2={W - pad} y2={pad + (H - pad * 2) * t}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <path d={areaPath} fill="url(#sp-grad)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="5" fill={color} />
      <circle cx={last[0]} cy={last[1]} r="10" fill="none" stroke={color} strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

export default function StockPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [holding, setHolding] = useState<Holding | null>(null);
  const [usdBalance, setUsdBalance] = useState<number>(0);
  const [candles, setCandles] = useState<number[]>([]);
  const [period, setPeriod] = useState<Period>("1M");
  const [candleLoading, setCandleLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("buy");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [txLoading, setTxLoading] = useState(false);
  const [txMsg, setTxMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async () => {
    if (!symbol || !token) return;
    setLoading(true);
    try {
      const [quoteRes, walletRes] = await Promise.all([
        fetch(`${BASE_URL}/stock/quote/${symbol}`, { headers }),
        fetch(`${BASE_URL}/wallet`, { headers }),
      ]);

      if (quoteRes.ok) {
        const d = await quoteRes.json();
        setQuote({
          symbol: symbol.toUpperCase(),
          currentPrice: d.c,
          change: d.d,
          percentChange: d.dp,
          highPrice: d.h,
          lowPrice: d.l,
          openPrice: d.o,
          previousClose: d.pc,
        });
      }

      if (walletRes.ok) {
        const w = await walletRes.json();
        const usd = (w.balances as WalletBalance[]).find((b) => b.currency === "USD");
        setUsdBalance(usd?.balance ?? 0);
      }

      const holdingRes = await fetch(`${BASE_URL}/portfolio/${symbol}`, { headers });
      if (holdingRes.ok) setHolding(await holdingRes.json());
      else setHolding(null);
    } catch {}
    setLoading(false);
  }, [symbol, token]);

  const loadCandles = useCallback(async (p: Period) => {
    if (!symbol || !token) return;
    setCandleLoading(true);
    const { resolution, seconds } = PERIOD_CONFIG[p];
    const to = Math.floor(Date.now() / 1000) - 86400;
    const from = to - seconds;
    try {
      const res = await fetch(`${BASE_URL}/stock/candles/${symbol}?resolution=${resolution}&from=${from}&to=${to}`, { headers });
      if (!res.ok) { setCandleLoading(false); return; }
      const data = await res.json();
      const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
      setCandles(Array.isArray(closes) ? closes.filter((v: number | null) => v !== null) : []);
    } catch { setCandles([]); }
    setCandleLoading(false);
  }, [symbol, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { loadCandles(period); }, [period, loadCandles]);

  const positive = (quote?.change ?? 0) >= 0;

  const estimatedShares = quote && parseFloat(amount) > 0
    ? parseFloat(amount) / quote.currentPrice
    : null;

  const estimatedValue = holding && parseFloat(amount) > 0
    ? parseFloat(amount)
    : null;

  const estimatedSellShares = holding && quote && parseFloat(amount) > 0
    ? parseFloat(amount) / quote.currentPrice
    : null;

  async function handleTrade() {
    if (!symbol || !token || !pin || pin.length !== 4) {
      setTxMsg({ text: "PIN must be exactly 4 digits.", ok: false });
      return;
    }
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setTxMsg({ text: "Enter a valid amount.", ok: false });
      return;
    }

    if (tab === "buy" && num > usdBalance) {
      setTxMsg({ text: "Insufficient USD balance.", ok: false });
      return;
    }

    setTxLoading(true);
    setTxMsg(null);

    try {
      const qty = tab === "buy"
        ? num / (quote?.currentPrice ?? 1)
        : num / (quote?.currentPrice ?? 1);

      const endpoint = tab === "buy" ? "/stock/buy" : "/stock/sell";
      const body = { symbol: symbol.toUpperCase(), quantity: parseFloat(qty.toFixed(6)), pinCode: pin };

      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setTxMsg({ text: data?.message ?? "Transaction failed.", ok: false });
      } else {
        setTxMsg({ text: data.message, ok: true });
        setAmount("");
        setPin("");
        fetchAll();
      }
    } catch {
      setTxMsg({ text: "Something went wrong. Try again.", ok: false });
    }
    setTxLoading(false);
  }

  if (loading) {
    return (
      <div className="sp-loading">
        <div className="sp-pulse" />
        <span>Loading {symbol?.toUpperCase()}…</span>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="sp-loading">
        <span>Could not load data for {symbol?.toUpperCase()}.</span>
        <button className="sp-back-btn" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    );
  }

  const maxSellUsd = holding ? holding.quantity * quote.currentPrice : 0;

  return (
    <div className="sp">
      <div className="sp__ambient">
        <div className={`sp__orb sp__orb--1 ${positive ? "pos" : "neg"}`} />
        <div className="sp__orb sp__orb--2" />
        <div className="sp__grid" />
      </div>

      <div className="sp__inner">
        <button className="sp__back" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="sp__hero">
          <div className="sp__hero-left">
            <div className="sp__avatar">{quote.symbol.slice(0, 2)}</div>
            <div>
              <h1 className="sp__symbol">{quote.symbol}</h1>
              {holding && <span className="sp__owned-badge">● You own {holding.quantity.toFixed(4)} shares</span>}
            </div>
          </div>
          <div className="sp__hero-right">
            <div className="sp__price">{fmt(quote.currentPrice)}</div>
            <div className={`sp__change ${positive ? "pos" : "neg"}`}>
              {positive ? "▲" : "▼"} {fmt(Math.abs(quote.change))} ({fmtPct(quote.percentChange)})
            </div>
          </div>
        </div>

        <div className="sp__chart-section">
          <div className="sp__periods">
            {(["1D", "1W", "1M", "1Y"] as Period[]).map((p) => (
              <button
                key={p}
                className={`sp__period-btn ${period === p ? "active" : ""} ${positive ? "pos" : "neg"}`}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="sp__chart">
            {candleLoading ? (
              <div className="sp__chart-shimmer" />
            ) : candles.length > 1 ? (
              <Sparkline prices={candles} positive={positive} />
            ) : (
              <div className="sp__chart-empty">No chart data available</div>
            )}
          </div>
        </div>

        <div className="sp__stats-row">
          <div className="sp__stat">
            <span className="sp__stat-label">Open</span>
            <span className="sp__stat-val">{fmt(quote.openPrice)}</span>
          </div>
          <div className="sp__stat">
            <span className="sp__stat-label">Prev Close</span>
            <span className="sp__stat-val">{fmt(quote.previousClose)}</span>
          </div>
          <div className="sp__stat">
            <span className="sp__stat-label">Day High</span>
            <span className="sp__stat-val sp__stat-val--up">{fmt(quote.highPrice)}</span>
          </div>
          <div className="sp__stat">
            <span className="sp__stat-label">Day Low</span>
            <span className="sp__stat-val sp__stat-val--down">{fmt(quote.lowPrice)}</span>
          </div>
          <div className="sp__stat">
            <span className="sp__stat-label">USD Balance</span>
            <span className="sp__stat-val">{fmt(usdBalance)}</span>
          </div>
          {holding && (
            <div className="sp__stat">
              <span className="sp__stat-label">Your P&L</span>
              <span className={`sp__stat-val ${holding.profitLoss >= 0 ? "sp__stat-val--up" : "sp__stat-val--down"}`}>
                {holding.profitLoss >= 0 ? "+" : ""}{fmt(holding.profitLoss)} ({fmtPct(holding.profitLossPercent)})
              </span>
            </div>
          )}
        </div>

        {holding && (
          <div className="sp__holding-card">
            <div className="sp__holding-row">
              <div className="sp__holding-item">
                <span>Shares Owned</span>
                <strong>{holding.quantity.toFixed(4)}</strong>
              </div>
              <div className="sp__holding-item">
                <span>Avg Buy Price</span>
                <strong>{fmt(holding.averageBuyPrice)}</strong>
              </div>
              <div className="sp__holding-item">
                <span>Current Value</span>
                <strong>{fmt(holding.totalValue)}</strong>
              </div>
              <div className="sp__holding-item">
                <span>Total P&L</span>
                <strong className={holding.profitLoss >= 0 ? "up" : "down"}>
                  {holding.profitLoss >= 0 ? "+" : ""}{fmt(holding.profitLoss)}
                </strong>
              </div>
            </div>
          </div>
        )}

        <div className="sp__trade">
          <div className="sp__trade-tabs">
            <button
              className={`sp__trade-tab sp__trade-tab--buy ${tab === "buy" ? "active" : ""}`}
              onClick={() => { setTab("buy"); setTxMsg(null); setAmount(""); }}
            >
              Buy
            </button>
            {holding && (
              <button
                className={`sp__trade-tab sp__trade-tab--sell ${tab === "sell" ? "active" : ""}`}
                onClick={() => { setTab("sell"); setTxMsg(null); setAmount(""); }}
              >
                Sell
              </button>
            )}
          </div>

          <div className="sp__trade-body">
            <div className="sp__trade-info">
              {tab === "buy" ? (
                <span>1 share ≈ {fmt(quote.currentPrice)} · Available: {fmt(usdBalance)}</span>
              ) : (
                <span>1 share ≈ {fmt(quote.currentPrice)} · Max sell: {fmt(maxSellUsd)}</span>
              )}
            </div>

            <div className="sp__input-wrap">
              <span className="sp__input-prefix">$</span>
              <input
                className="sp__amount-input"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {tab === "buy" && estimatedShares !== null && (
              <p className="sp__estimate">
                ≈ {estimatedShares.toFixed(6)} shares of {quote.symbol}
              </p>
            )}
            {tab === "sell" && estimatedSellShares !== null && holding && (
              <p className="sp__estimate">
                ≈ {Math.min(estimatedSellShares, holding.quantity).toFixed(6)} shares sold
              </p>
            )}

            {tab === "buy" && (
              <div className="sp__quick-row">
                {[50, 100, 250, 500].map((v) => (
                  <button
                    key={v}
                    className={`sp__quick ${parseFloat(amount) === v ? "active" : ""}`}
                    onClick={() => setAmount(String(v))}
                  >
                    ${v}
                  </button>
                ))}
              </div>
            )}

            {tab === "sell" && holding && (
              <div className="sp__quick-row">
                {[0.25, 0.5, 0.75, 1].map((f) => {
                  const val = parseFloat((maxSellUsd * f).toFixed(2));
                  return (
                    <button
                      key={f}
                      className={`sp__quick ${parseFloat(amount) === val ? "active" : ""}`}
                      onClick={() => setAmount(String(val))}
                    >
                      {f === 1 ? "All" : `${f * 100}%`}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="sp__pin-row">
              <label className="sp__pin-label">Card PIN</label>
              <input
                className="sp__pin-input"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>

            {txMsg && (
              <p className={`sp__tx-msg ${txMsg.ok ? "ok" : "err"}`}>{txMsg.text}</p>
            )}

            <button
              className={`sp__submit ${tab}`}
              onClick={handleTrade}
              disabled={txLoading || !amount || !pin || pin.length !== 4}
            >
              {txLoading ? <span className="sp__submit-spinner" /> : null}
              {txLoading
                ? "Processing…"
                : tab === "buy"
                ? `Buy ${quote.symbol}`
                : `Sell ${quote.symbol}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}