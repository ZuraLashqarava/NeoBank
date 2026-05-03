import React, { useState } from "react";
import "./OwnAccount.scss";

const BASE_URL = "https://localhost:7096/api";

export default function OwnAccount() {
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    const rawCard = cardNumber.replace(/\s/g, "");
    if (rawCard.length !== 16) return setErrorMsg("Enter a valid 16-digit card number.");
    if (!cardHolder.trim()) return setErrorMsg("Enter the cardholder name.");
    if (!expiry || expiry.length < 5) return setErrorMsg("Enter a valid expiry date (MM/YY).");
    if (!cvc || cvc.length < 3) return setErrorMsg("Enter a valid CVC.");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return setErrorMsg("Enter a valid amount.");

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/transaction/transfer/own-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(amount),
          description: `Top-up from card ending ${rawCard.slice(-4)}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message ?? "Transfer successful.");
        setCardNumber("");
        setCardHolder("");
        setExpiry("");
        setCvc("");
        setAmount("");
      } else {
        setErrorMsg(data.message ?? "Transfer failed.");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="own">
      <div className="own__ambient" aria-hidden="true">
        <div className="own-orb own-orb--1" />
        <div className="own-orb own-orb--2" />
      </div>

      <div className="own__inner">
        <header className="own__header">
          <p className="own__label">Payments</p>
          <h1 className="own__title">Own Account</h1>
        </header>

        <div className="own__card">
          <div className="own__section-label">Card Details</div>

          <div className="own__field">
            <label className="own__field-label">Card Number</label>
            <input
              className="own__input own__input--card"
              type="text"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              inputMode="numeric"
              autoComplete="cc-number"
              maxLength={19}
            />
          </div>

          <div className="own__field">
            <label className="own__field-label">Cardholder Name</label>
            <input
              className="own__input"
              type="text"
              placeholder="JOHN DOE"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              autoComplete="cc-name"
            />
          </div>

          <div className="own__row">
            <div className="own__field">
              <label className="own__field-label">Expiry Date</label>
              <input
                className="own__input"
                type="text"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                inputMode="numeric"
                autoComplete="cc-exp"
                maxLength={5}
              />
            </div>

            <div className="own__field">
              <label className="own__field-label">CVC</label>
              <input
                className="own__input own__input--cvc"
                type="password"
                placeholder="•••"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
              />
            </div>
          </div>

          <div className="own__divider" />

          <div className="own__section-label">Transfer Details</div>

          <div className="own__field">
            <label className="own__field-label">Amount</label>
            <div className="own__amount-wrap">
              <span className="own__currency">$</span>
              <input
                className="own__input own__input--amount"
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {errorMsg && <div className="own__msg own__msg--error">{errorMsg}</div>}
          {successMsg && <div className="own__msg own__msg--success">{successMsg}</div>}

          <button
            className="own__submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <span className="own__spinner own__spinner--btn" /> : "Transfer Funds"}
          </button>
        </div>
      </div>
    </div>
  );
}