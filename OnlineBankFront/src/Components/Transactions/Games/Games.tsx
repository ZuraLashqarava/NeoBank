import React, { useState } from "react";
import "./Games.scss";

const BASE_URL = "https://localhost:7096/api";

interface Platform {
  id: string;
  label: string;
  icon: string;
}

const PLATFORMS: Platform[] = [
  { id: "betlive",    label: "Betlive",    icon: "Betlive.png" },
  { id: "crystalbet", label: "Crystalbet", icon: "Crystalbet.jpg" },
  { id: "adjarabet",  label: "Adjarabet",  icon: "Adjarabet.png" },
  { id: "crocobet",   label: "Crocobet",   icon: "Crocobet.jpg" },
  { id: "steam",      label: "Steam",      icon: "Steam.png" },
  { id: "epic",       label: "Epic Games", icon: "EpicGames.png" },
];

export default function Games() {
  const [selected, setSelected] = useState<Platform | null>(null);
  const [paymentCode, setPaymentCode] = useState("");
  const [amount, setAmount] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSelect = (platform: Platform) => {
    setSelected(platform);
    setPaymentCode("");
    setAmount("");
    setPinCode("");
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleClose = () => {
    setSelected(null);
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!paymentCode || paymentCode.length !== 10) return setErrorMsg("Enter a valid 10-digit payment code.");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return setErrorMsg("Enter a valid amount.");
    if (!pinCode || pinCode.length !== 4) return setErrorMsg("Enter your 4-digit PIN.");

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/transaction/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(amount),
          pinCode,
          category: 4,
          recipientLabel: selected!.label,
          description: `${selected!.label} · Code: ${paymentCode}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message ?? "Payment successful.");
        setPaymentCode("");
        setAmount("");
        setPinCode("");
      } else {
        setErrorMsg(data.message ?? "Payment failed.");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="games">
      <div className="games__ambient" aria-hidden="true">
        <div className="games-orb games-orb--1" />
        <div className="games-orb games-orb--2" />
      </div>

      <div className="games__inner">
        <header className="games__header">
          <p className="games__label">Payments</p>
          <h1 className="games__title">Games</h1>
        </header>

        <div className="games__section-label">Select Platform</div>

        <div className="games__grid">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              className={`games__card ${selected?.id === platform.id ? "games__card--active" : ""}`}
              onClick={() => handleSelect(platform)}
            >
              <div className="games__card-img">
                <img
                  src={`/src/assets/${platform.icon}`}
                  alt={platform.label}
                  className="games__card-icon"
                />
              </div>
              <span className="games__card-label">{platform.label}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div className="games__panel" key={selected.id}>
            <div className="games__panel-header">
              <span className="games__panel-title">Pay to {selected.label}</span>
              <button className="games__panel-close" onClick={handleClose} aria-label="Close">✕</button>
            </div>

            <div className="games__panel-body">
              <div className="games__field">
                <label className="games__field-label">Payment Code</label>
                <input
                  className="games__input"
                  type="text"
                  placeholder="10-digit code"
                  maxLength={10}
                  value={paymentCode}
                  onChange={(e) => setPaymentCode(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>

              <div className="games__field">
                <label className="games__field-label">Amount</label>
                <div className="games__amount-wrap">
                  <span className="games__currency">$</span>
                  <input
                    className="games__input games__input--amount"
                    type="number"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="games__field">
                <label className="games__field-label">Your PIN Code</label>
                <input
                  className="games__input games__input--pin"
                  type="password"
                  placeholder="••••"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                />
              </div>

              {errorMsg && <div className="games__msg games__msg--error">{errorMsg}</div>}
              {successMsg && <div className="games__msg games__msg--success">{successMsg}</div>}

              <button
                className="games__submit"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <span className="games__spinner games__spinner--btn" /> : "Pay Now"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}