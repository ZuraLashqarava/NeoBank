import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Transactions.scss";

const BASE_URL = "https://localhost:7096/api";

interface Category {
  id: string;
  label: string;
  icon: string;
  route: string;
}

interface Transaction {
  id: string;
  senderName: string;
  recipientName: string | null;
  recipientLabel: string;
  amount: number;
  category: string;
  description: string;
  status: string;
  createdAt: string;
}

const CATEGORIES: Category[] = [
  { id: "other-person",        label: "Other Person",        icon: "lending.png",    route: "/transactions/TransactionToOther" },
  { id: "own-account",         label: "Own Account",         icon: "lender.png",     route: "/transactions/own-account" },
  { id: "utilities",           label: "Utilities",           icon: "utilities.png",  route: "/transactions/Utilities" },
  { id: "transit",             label: "Transit",             icon: "bus-stop.png",   route: "/transactions/transit" },
  { id: "games",               label: "Games",               icon: "joystick.png",   route: "/transactions/Games" },
  { id: "education",           label: "Education",           icon: "education.png",  route: "/transactions/education" },
  { id: "charity",             label: "Charity",             icon: "donation.png",   route: "/transactions/charity" },
  { id: "mobile-phone",        label: "Mobile Phone",        icon: "chat.png",       route: "/transactions/MobilePhone" },
  { id: "currency-conversion", label: "Currency Conversion", icon: "currency.png",   route: "/transactions/CurrencyTransition" },
];

const CATEGORY_COLORS: Record<string, string> = {
  OtherPerson:        "#00e5a0",
  OwnAccount:         "#00c282",
  Utilities:          "#4fd1c5",
  Transit:            "#38bdf8",
  Games:              "#818cf8",
  Education:          "#f59e0b",
  Charity:            "#fb7185",
  MobilePhone:        "#a78bfa",
  CurrencyConversion: "#34d399",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) {
    return "Today, " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (days === 1) {
    return "Yesterday, " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" }) +
      ", " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
}

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUserName = localStorage.getItem("fullName") ?? "";

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/transaction`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load transactions.");
        const data: Transaction[] = await res.json();
        setTransactions(data);
      } catch {
        setError("Could not load transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const isCredit = (tx: Transaction) => tx.senderName !== currentUserName;

  const getDisplayName = (tx: Transaction): string => {
    if (isCredit(tx)) return tx.senderName;
    return tx.recipientName ?? tx.recipientLabel ?? "Unknown";
  };

  const getSubtitle = (tx: Transaction): string => {
    if (isCredit(tx)) return `Received · ${tx.category}`;
    return tx.description?.trim() ? tx.description : tx.category;
  };

  const monthlySpend = transactions
    .filter((tx) => !isCredit(tx))
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="transactions">
      <div className="transactions__ambient" aria-hidden="true">
        <div className="tx-orb tx-orb--1" />
        <div className="tx-orb tx-orb--2" />
        <div className="tx-grid" />
      </div>

      <div className="transactions__inner">
        <header className="transactions__header">
          <div>
            <p className="tx-header-label">Payments</p>
            <h1 className="tx-header-title">Transactions</h1>
          </div>
          <div className="tx-header-total">
            <span className="tx-header-total-label">This Month</span>
            <span className="tx-header-total-value">−${monthlySpend.toFixed(2)}</span>
          </div>
        </header>

        <section className="transactions__categories">
          <div className="categories-label">
            <span>Categories</span>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className="cat-card"
                onClick={() => navigate(cat.route)}
              >
                <div className="cat-card__icon" aria-hidden="true">
                  <img
                    src={`/src/assets/${cat.icon}`}
                    alt={cat.label}
                    className="cat-card__icon-img"
                  />
                </div>
                <span className="cat-card__label">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="transactions__recent">
          <div className="recent-header">
            <span className="recent-title">Recent Transactions</span>
            <span className="recent-count">{transactions.length} entries</span>
          </div>

          <div className="recent-list">
            {loading && (
              <div className="recent-empty">
                <span className="tx-loading-spinner" />
              </div>
            )}

            {!loading && error && (
              <div className="recent-empty recent-empty--error">{error}</div>
            )}

            {!loading && !error && transactions.length === 0 && (
              <div className="recent-empty">No transactions yet.</div>
            )}

            {!loading && !error && transactions.map((tx, i) => {
              const credit = isCredit(tx);
              const displayName = getDisplayName(tx);
              const color = CATEGORY_COLORS[tx.category] ?? "#00e5a0";

              return (
                <div
                  key={tx.id}
                  className="tx-row"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div
                    className="tx-row__avatar"
                    style={{ "--avatar-color": color } as React.CSSProperties}
                  >
                    {getInitials(displayName)}
                  </div>

                  <div className="tx-row__info">
                    <span className="tx-row__name">{displayName}</span>
                    <span className="tx-row__sub">{getSubtitle(tx)}</span>
                  </div>

                  <div className="tx-row__right">
                    <span className={`tx-row__amount ${credit ? "tx-row__amount--credit" : ""}`}>
                      {credit ? "+" : "−"}${tx.amount.toFixed(2)}
                    </span>
                    <span className="tx-row__date">{formatDate(tx.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}