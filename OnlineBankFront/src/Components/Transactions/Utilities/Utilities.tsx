import React, { useState } from "react";
import "./Utilities.scss";

const BASE_URL = "https://localhost:7096/api";

const UTILITY_OPTIONS = [
  { value: "Electricity", label: "Electricity" },
  { value: "Water",       label: "Water" },
  { value: "Internet",    label: "Internet" },
  { value: "Natural Gas", label: "Natural Gas" },
];

export default function Utilities() {
  const [utilityType, setUtilityType] = useState("");
  const [paymentCode, setPaymentCode] = useState("");
  const [amount, setAmount] = useState("");
  const [pinCode, setPinCode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!utilityType) return setErrorMsg("Select a utility type.");
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
          category: 2,
          recipientLabel: utilityType,
          description: `${utilityType} · Code: ${paymentCode}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message ?? "Payment successful.");
        setUtilityType("");
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
    <div className="util">
      <div className="util__ambient" aria-hidden="true">
        <div className="util-orb util-orb--1" />
        <div className="util-orb util-orb--2" />
      </div>

      <div className="util__inner">
        <header className="util__header">
          <p className="util__label">Payments</p>
          <h1 className="util__title">Utilities</h1>
        </header>

        <div className="util__card">
          <div className="util__section-label">Service</div>

          <div className="util__field">
            <label className="util__field-label">Utility Type</label>
            <div className="util__select-wrap">
              <select
                className="util__select"
                value={utilityType}
                onChange={(e) => setUtilityType(e.target.value)}
              >
                <option value="" disabled>Select a service...</option>
                {UTILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="util__select-arrow" aria-hidden="true">▾</span>
            </div>
          </div>

          <div className="util__divider" />

          <div className="util__section-label">Payment Details</div>

          <div className="util__field">
            <label className="util__field-label">Payment Code</label>
            <input
              className="util__input"
              type="text"
              placeholder="10-digit code"
              maxLength={10}
              value={paymentCode}
              onChange={(e) => setPaymentCode(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              autoComplete="off"
            />
          </div>

          <div className="util__field">
            <label className="util__field-label">Amount</label>
            <div className="util__amount-wrap">
              <span className="util__currency">$</span>
              <input
                className="util__input util__input--amount"
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="util__divider" />

          <div className="util__section-label">Confirmation</div>

          <div className="util__field">
            <label className="util__field-label">Your PIN Code</label>
            <input
              className="util__input util__input--pin"
              type="password"
              placeholder="••••"
              maxLength={4}
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
            />
          </div>

          {errorMsg && <div className="util__msg util__msg--error">{errorMsg}</div>}
          {successMsg && <div className="util__msg util__msg--success">{successMsg}</div>}

          <button
            className="util__submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <span className="util__spinner util__spinner--btn" /> : "Pay Now"}
          </button>
        </div>
      </div>
    </div>
  );
}