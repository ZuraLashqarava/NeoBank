import React, { useEffect, useState, useCallback } from "react";
import "./CurrencyTransition.scss";

interface WalletBalance {
  currency: string;
  balance: number;
}

interface Wallet {
  id: string;
  userId: string;
  balances: WalletBalance[];
}

interface RateResult {
  fromCurrency: string;
  fromCurrencyName: string;
  toCurrency: string;
  toCurrencyName: string;
  rate: number;
  lastRefreshed: string;
}

interface ConversionResult {
  conversionId: string;
  transactionId: string;
  fromCurrency: string;
  toCurrency: string;
  sourceAmount: number;
  convertedAmount: number;
  exchangeRate: number;
  newWalletBalance: number;
  createdAt: string;
}

const API_BASE = "https://localhost:7096/api";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥",
  CHF: "Fr", CAD: "CA$", AUD: "A$", INR: "₹", KRW: "₩",
  GEL: "₾", TRY: "₺", RUB: "₽", BRL: "R$", MXN: "MX$",
  SEK: "kr", NOK: "kr", DKK: "kr", PLN: "zł", CZK: "Kč",
  HUF: "Ft", ZAR: "R", SGD: "S$", HKD: "HK$", AED: "د.إ",
};

const TO_CURRENCY_OPTIONS = [
  "USD", "EUR", "GBP", "GEL", "JPY", "CHF", "CAD",
  "AUD", "CNY", "INR", "TRY", "BRL", "SEK", "NOK",
  "PLN", "AED", "SGD", "HKD", "KRW", "ZAR",
];

function sym(code: string): string {
  return CURRENCY_SYMBOLS[code.toUpperCase()] ?? code;
}

function formatRate(rate: number): string {
  if (rate >= 100) return rate.toFixed(0);
  if (rate >= 10) return rate.toFixed(1);
  return rate.toFixed(2);
}

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function apiFetch<T>(path: string, token: string, method: "GET" | "POST" = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export default function CurrencyTransition() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  const [fromCurrency, setFromCurrency] = useState<string>("");
  const [toCurrency, setToCurrency] = useState<string>("EUR");

  const [amount, setAmount] = useState<string>("");
  const [pin, setPin] = useState<string>("");

  const [rate, setRate] = useState<RateResult | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const token = getToken();

  useEffect(() => {
    if (!token) { setWalletLoading(false); return; }
    apiFetch<Wallet>("/Wallet", token)
      .then((w) => {
        setWallet(w);
        if (w.balances.length > 0) {
          setFromCurrency(w.balances[0].currency);
        }
      })
      .catch(() => {})
      .finally(() => setWalletLoading(false));
  }, []);

  const fetchRate = useCallback(async () => {
    if (!fromCurrency || !toCurrency || fromCurrency === toCurrency || !token) return;
    setRateLoading(true);
    setRateError(null);
    setRate(null);
    try {
      const data = await apiFetch<RateResult>(`/Currency/rate?from=${fromCurrency}&to=${toCurrency}`, token);
      setRate(data);
    } catch (e) {
      setRateError((e as Error).message);
    } finally {
      setRateLoading(false);
    }
  }, [fromCurrency, toCurrency, token]);

  useEffect(() => {
    if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
      fetchRate();
    }
  }, [fromCurrency, toCurrency]);

  const fromBalance = wallet?.balances.find((b) => b.currency === fromCurrency);
  const numAmount = parseFloat(amount) || 0;
  const convertedPreview = rate && numAmount > 0 ? numAmount * rate.rate : null;

  const quickAmounts = (() => {
    if (!fromBalance) return [];
    const bal = fromBalance.balance;
    const options = [
      Math.floor(bal * 0.25 * 100) / 100,
      Math.floor(bal * 0.5 * 100) / 100,
      Math.floor(bal * 0.75 * 100) / 100,
      Math.floor(bal * 100) / 100,
    ].filter((v) => v > 0);
    const unique = [...new Set(options)];
    return unique.slice(0, 4);
  })();

  async function handleSubmit() {
    if (!token) return;
    if (!fromCurrency || !toCurrency) return;
    if (numAmount <= 0) { setSubmitError("Enter a valid amount."); return; }
    if (!fromBalance || numAmount > fromBalance.balance) { setSubmitError(`Insufficient ${fromCurrency} balance.`); return; }
    if (pin.length !== 4) { setSubmitError("PIN must be exactly 4 digits."); return; }

    setSubmitting(true);
    setSubmitError(null);
    setResult(null);

    try {
      const data = await apiFetch<ConversionResult>("/Currency/convert", token, "POST", {
        fromCurrency,
        toCurrency,
        amount: numAmount,
        pinCode: pin,
      });
      setResult(data);
      setAmount("");
      setPin("");
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (walletLoading) {
    return (
      <div className="ct-loading">
        <div className="ct-pulse" />
        <span>Loading wallet…</span>
      </div>
    );
  }

  const availableFrom = wallet?.balances ?? [];
  const availableTo = TO_CURRENCY_OPTIONS.filter((c) => c !== fromCurrency);

  return (
    <div className="ct">
      <div className="ct__ambient" aria-hidden="true">
        <div className="ct-orb ct-orb--1" />
        <div className="ct-orb ct-orb--2" />
        <div className="ct-grid" />
      </div>

      <div className="ct__inner">
        <header className="ct__header">
          <p className="ct__header-label">Wallet</p>
          <h1 className="ct__header-title">Currency Conversion</h1>
        </header>

        <div className="ct__rate-bar">
          {rateLoading && <span className="ct__rate-loading">Fetching rate…</span>}
          {rateError && <span className="ct__rate-error">{rateError}</span>}
          {rate && !rateLoading && (
            <>
              <span className="ct__rate-pair">{rate.fromCurrency} → {rate.toCurrency}</span>
              <span className="ct__rate-eq">
                1 {rate.fromCurrency} = <strong>{formatRate(rate.rate)}</strong> {rate.toCurrency}
              </span>
              <span className="ct__rate-refresh" onClick={fetchRate}>↻ Refresh</span>
            </>
          )}
          {!rate && !rateLoading && !rateError && (
            <span className="ct__rate-hint">Select currencies to see live rate</span>
          )}
        </div>

        {result && (
          <div className="ct__success">
            <div className="ct__success-icon">✓</div>
            <p className="ct__success-title">Conversion Complete</p>
            <p className="ct__success-detail">
              {sym(result.fromCurrency)}{result.sourceAmount.toFixed(2)} {result.fromCurrency}
              {" → "}
              {sym(result.toCurrency)}{result.convertedAmount.toFixed(2)} {result.toCurrency}
            </p>
            <p className="ct__success-balance">
              Remaining {result.fromCurrency} balance: {sym(result.fromCurrency)}{result.newWalletBalance.toFixed(2)}
            </p>
            <button className="ct__success-dismiss" onClick={() => setResult(null)}>Done</button>
          </div>
        )}

        {!result && (
          <>
            <div className="ct__panels">
              <div className="ct__panel">
                <p className="ct__panel-label">Convert From</p>
                <div className="ct__currency-list">
                  {availableFrom.length === 0 && (
                    <p className="ct__empty">No balances available</p>
                  )}
                  {availableFrom.map((b) => (
                    <button
                      key={b.currency}
                      className={`ct__currency-card ${fromCurrency === b.currency ? "active" : ""}`}
                      onClick={() => {
                        setFromCurrency(b.currency);
                        setAmount("");
                      }}
                    >
                      <span className="ct__currency-code">{b.currency}</span>
                      <span className="ct__currency-sym">{sym(b.currency)}</span>
                      <span className="ct__currency-bal">
                        {sym(b.currency)}{b.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="ct__divider">
                <div className="ct__divider-line" />
                <div className="ct__divider-icon">⇄</div>
                <div className="ct__divider-line" />
              </div>

              <div className="ct__panel">
                <p className="ct__panel-label">Convert To</p>
                <div className="ct__currency-list ct__currency-list--to">
                  {availableTo.map((c) => (
                    <button
                      key={c}
                      className={`ct__currency-card ct__currency-card--to ${toCurrency === c ? "active" : ""}`}
                      onClick={() => setToCurrency(c)}
                    >
                      <span className="ct__currency-code">{c}</span>
                      <span className="ct__currency-sym">{sym(c)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="ct__amount-section">
              <div className="ct__amount-header">
                <span className="ct__amount-label">Amount to Convert</span>
                {fromBalance && (
                  <span className="ct__amount-available">
                    Available: {sym(fromCurrency)}{fromBalance.balance.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="ct__amount-input-wrap">
                <span className="ct__amount-prefix">{fromCurrency ? sym(fromCurrency) : "$"}</span>
                <input
                  className="ct__amount-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {convertedPreview !== null && (
                  <span className="ct__amount-preview">
                    ≈ {sym(toCurrency)}{convertedPreview.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrency}
                  </span>
                )}
              </div>

              {quickAmounts.length > 0 && (
                <div className="ct__quick-amounts">
                  {quickAmounts.map((v) => (
                    <button
                      key={v}
                      className={`ct__quick-btn ${parseFloat(amount) === v ? "active" : ""}`}
                      onClick={() => setAmount(String(v))}
                    >
                      {sym(fromCurrency)}{v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="ct__confirm">
              <div className="ct__pin-wrap">
                <label className="ct__pin-label">Card PIN</label>
                <input
                  className="ct__pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </div>

              {submitError && <p className="ct__submit-error">{submitError}</p>}

              <button
                className="ct__submit-btn"
                onClick={handleSubmit}
                disabled={submitting || !fromCurrency || !toCurrency || numAmount <= 0 || pin.length !== 4}
              >
                {submitting ? <span className="ct__submit-spinner" /> : null}
                {submitting ? "Converting…" : `Convert ${fromCurrency} → ${toCurrency}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}