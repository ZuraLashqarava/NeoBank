import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./StockMarket.scss";

const BASE_URL = "https://localhost:7096/api";

const FEATURED_SYMBOLS = [
  "AAPL","TSLA","MSFT","GOOGL","AMZN","NVDA","META","NFLX",
  "AMD","INTC","ORCL","CRM","ADBE","PYPL","UBER","ABNB",
  "SPOT","COIN","PLTR","SNOW"
];

type Period = "1D" | "1W" | "1M" | "1Y";

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

interface SearchResult {
  symbol: string;
  description: string;
  type: string;
}

interface PortfolioItem {
  symbol: string;
  companyName: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  holdingsCount: number;
}

export default function StockMarket() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"market" | "portfolio">("market");
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchQuote = useCallback(async (symbol: string): Promise<StockQuote | null> => {
    try {
      const res = await fetch(`${BASE_URL}/stock/quote/${symbol}`, { headers });
      if (!res.ok) return null;
      const d = await res.json();
      return {
        symbol,
        currentPrice: d.c,
        change: d.d,
        percentChange: d.dp,
        highPrice: d.h,
        lowPrice: d.l,
        openPrice: d.o,
        previousClose: d.pc,
      };
    } catch { return null; }
  }, [token]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const results = await Promise.all(FEATURED_SYMBOLS.map(fetchQuote));
      setQuotes(results.filter(Boolean) as StockQuote[]);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (activeTab !== "portfolio") return;
    setPortfolioLoading(true);
    Promise.all([
      fetch(`${BASE_URL}/portfolio`, { headers }).then((r) => r.json()),
      fetch(`${BASE_URL}/portfolio/summary`, { headers }).then((r) => r.json()),
    ])
      .then(([items, summary]) => {
        setPortfolio(Array.isArray(items) ? items : []);
        setPortfolioSummary(summary);
      })
      .catch(() => {})
      .finally(() => setPortfolioLoading(false));
  }, [activeTab]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const res = await fetch(`${BASE_URL}/stock/search?q=${searchQuery}`, { headers });
      const data = await res.json();
      setSearchResults(
        (data.result || []).slice(0, 6).map((r: { symbol: string; description: string; type: string }) => ({
          symbol: r.symbol,
          description: r.description,
          type: r.type,
        }))
      );
    } catch {}
    setSearchLoading(false);
  };

  const handleSelectSymbol = (symbol: string) => {
    setSearchResults([]);
    setSearchQuery('');
    navigate(`/stock/${symbol}`);
  };

  const fmt = (n: number) => n?.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n?.toFixed(2)}%`;

  return (
    <div className="stock-market">
      <div className="stock-market__bg" />

      <div className="stock-market__header">
        <div className="stock-market__header-left">
          <span className="stock-market__header-tag">LIVE</span>
          <h1 className="stock-market__title">Stock Market</h1>
          <p className="stock-market__subtitle">Real-time data via Finnhub</p>
        </div>
        <div className="stock-market__tabs">
          <button
            className={`stock-market__tab ${activeTab === "market" ? "active" : ""}`}
            onClick={() => setActiveTab("market")}
          >
            Market
          </button>
          <button
            className={`stock-market__tab ${activeTab === "portfolio" ? "active" : ""}`}
            onClick={() => setActiveTab("portfolio")}
          >
            My Portfolio
          </button>
        </div>
      </div>

      {activeTab === "market" && (
        <>
          <div className="stock-market__search-row">
            <div className="stock-market__search">
              <svg className="stock-market__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search symbol or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="stock-market__search-input"
              />
              <button className="stock-market__search-btn" onClick={handleSearch}>
                {searchLoading ? <span className="stock-market__spinner" /> : "Search"}
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="stock-market__search-results">
              {searchResults.map((r) => (
                <button
                  key={r.symbol}
                  className="stock-market__search-result-item"
                  onClick={() => handleSelectSymbol(r.symbol)}
                >
                  <span className="stock-market__search-result-symbol">{r.symbol}</span>
                  <span className="stock-market__search-result-desc">{r.description}</span>
                  <span className="stock-market__search-result-type">{r.type}</span>
                </button>
              ))}
            </div>
          )}

          <div className="stock-market__section-label">Featured Stocks</div>

          {loading ? (
            <div className="stock-market__grid">
              {FEATURED_SYMBOLS.map((s) => <div key={s} className="stock-market__skeleton" />)}
            </div>
          ) : (
            <div className="stock-market__grid">
              {quotes.map((q, i) => (
                <QuoteCard
                  key={q.symbol}
                  quote={q}
                  index={i}
                  token={token!}
                  onClick={() => navigate(`/stock/${q.symbol}`)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "portfolio" && (
        <div className="stock-market__portfolio">
          {portfolioLoading ? (
            <div className="stock-market__grid">
              {[1, 2, 3].map((i) => <div key={i} className="stock-market__skeleton" />)}
            </div>
          ) : (
            <>
              {portfolioSummary && portfolioSummary.holdingsCount > 0 && (
                <div className="portfolio-summary">
                  <div className="portfolio-summary__item">
                    <span>Total Value</span>
                    <strong>{fmt(portfolioSummary.totalValue)}</strong>
                  </div>
                  <div className="portfolio-summary__item">
                    <span>Total Cost</span>
                    <strong>{fmt(portfolioSummary.totalCost)}</strong>
                  </div>
                  <div className="portfolio-summary__item">
                    <span>Total P&L</span>
                    <strong className={portfolioSummary.totalProfitLoss >= 0 ? "up" : "down"}>
                      {portfolioSummary.totalProfitLoss >= 0 ? "+" : ""}{fmt(portfolioSummary.totalProfitLoss)}
                    </strong>
                  </div>
                  <div className="portfolio-summary__item">
                    <span>Return</span>
                    <strong className={portfolioSummary.totalProfitLossPercent >= 0 ? "up" : "down"}>
                      {fmtPct(portfolioSummary.totalProfitLossPercent)}
                    </strong>
                  </div>
                </div>
              )}

              {portfolio.length === 0 ? (
                <div className="portfolio-empty">
                  <p>You don't own any stocks yet.</p>
                  <button onClick={() => setActiveTab("market")}>Browse Market →</button>
                </div>
              ) : (
                <div className="stock-market__grid">
                  {portfolio.map((item, i) => (
                    <div
                      key={item.symbol}
                      className="portfolio-card"
                      style={{ animationDelay: `${i * 50}ms`, cursor: "pointer" }}
                      onClick={() => navigate(`/stock/${item.symbol}`)}
                    >
                      <div className="portfolio-card__top">
                        <div className="portfolio-card__avatar">{item.symbol.slice(0, 2)}</div>
                        <div>
                          <div className="portfolio-card__symbol">{item.symbol}</div>
                          <div className="portfolio-card__name">{item.companyName}</div>
                        </div>
                        <div className={`portfolio-card__badge ${item.profitLoss >= 0 ? "positive" : "negative"}`}>
                          {item.profitLoss >= 0 ? "▲" : "▼"} {fmtPct(item.profitLossPercent)}
                        </div>
                      </div>

                      <div className="portfolio-card__price">{fmt(item.currentPrice)}</div>

                      <div className="portfolio-card__row">
                        <div className="portfolio-card__stat">
                          <span>Shares</span>
                          <strong>{item.quantity.toFixed(4)}</strong>
                        </div>
                        <div className="portfolio-card__stat">
                          <span>Avg Buy</span>
                          <strong>{fmt(item.averageBuyPrice)}</strong>
                        </div>
                        <div className="portfolio-card__stat">
                          <span>Value</span>
                          <strong>{fmt(item.totalValue)}</strong>
                        </div>
                        <div className="portfolio-card__stat">
                          <span>P&L</span>
                          <strong className={item.profitLoss >= 0 ? "up" : "down"}>
                            {item.profitLoss >= 0 ? "+" : ""}{fmt(item.profitLoss)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function QuoteCard({
  quote,
  featured = false,
  index = 0,
  token,
  onClick,
}: {
  quote: StockQuote;
  featured?: boolean;
  index?: number;
  token: string;
  onClick: () => void;
}) {
  const [period, setPeriod] = useState<Period>("1M");
  const [candles, setCandles] = useState<number[]>([]);
  const [candleLoading, setCandleLoading] = useState(false);
  const positive = quote.change >= 0;

  const loadCandles = useCallback(async (p: Period) => {
    setCandleLoading(true);
    const { resolution, seconds } = PERIOD_CONFIG[p];
    const to = Math.floor(Date.now() / 1000) - 86400;
    const from = to - seconds;
    try {
      const res = await fetch(
        `${BASE_URL}/stock/candles/${quote.symbol}?resolution=${resolution}&from=${from}&to=${to}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) { setCandleLoading(false); return; }
      const data = await res.json();
      const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
      setCandles(Array.isArray(closes) ? closes.filter((v: number | null) => v !== null) : []);
    } catch { setCandles([]); }
    setCandleLoading(false);
  }, [quote.symbol, token]);

  useEffect(() => { loadCandles(period); }, [period]);

  const fmt = (n: number) => n?.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n?.toFixed(2)}%`;

  return (
    <div
      className={`quote-card ${positive ? "quote-card--up" : "quote-card--down"} ${featured ? "quote-card--featured" : ""}`}
      style={{ animationDelay: `${index * 50}ms`, cursor: "pointer" }}
      onClick={onClick}
    >
      <div className="quote-card__top">
        <div className="quote-card__symbol-row">
          <div className="quote-card__avatar">{quote.symbol.slice(0, 2)}</div>
          <div>
            <div className="quote-card__symbol">{quote.symbol}</div>
            <div className="quote-card__name">{quote.symbol}</div>
          </div>
        </div>
        <div className={`quote-card__badge ${positive ? "positive" : "negative"}`}>
          {positive ? "▲" : "▼"} {fmtPct(quote.percentChange)}
        </div>
      </div>

      <div className="quote-card__price">{fmt(quote.currentPrice)}</div>
      <div className="quote-card__change" style={{ color: positive ? "#00e5a0" : "#ff6b6b" }}>
        {positive ? "+" : ""}{quote.change?.toFixed(2)} today
      </div>

      <div className="quote-card__periods" onClick={(e) => e.stopPropagation()}>
        {(["1D","1W","1M","1Y"] as Period[]).map((p) => (
          <button
            key={p}
            className={`quote-card__period-btn ${period === p ? "active" : ""} ${positive ? "pos" : "neg"}`}
            onClick={() => setPeriod(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="quote-card__chart">
        {candleLoading ? (
          <div className="quote-card__chart-loading" />
        ) : candles.length > 1 ? (
          <Sparkline prices={candles} positive={positive} />
        ) : (
          <div className="quote-card__chart-empty">No data</div>
        )}
      </div>

      <div className="quote-card__range">
        <span>L {fmt(quote.lowPrice)}</span>
        <span>H {fmt(quote.highPrice)}</span>
      </div>

      {featured && (
        <div className="quote-card__extra">
          <div className="quote-card__stat">
            <span>Open</span><span>{fmt(quote.openPrice)}</span>
          </div>
          <div className="quote-card__stat">
            <span>Prev Close</span><span>{fmt(quote.previousClose)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Sparkline({ prices, positive }: { prices: number[]; positive: boolean }) {
  const W = 260;
  const H = 64;
  const pad = 4;
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
  const gradId = `grad-${positive ? "up" : "dn"}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="sparkline">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
    </svg>
  );
}