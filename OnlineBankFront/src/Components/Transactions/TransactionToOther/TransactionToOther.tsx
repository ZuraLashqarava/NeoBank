import React, { useState, useEffect, useRef } from "react";
import "./TransactionToOther.scss";

const BASE_URL = "https://localhost:7096/api";

interface RecipientInfo {
  fullName: string;
}

export default function TransactionToOther() {
  const [personalNumber, setPersonalNumber] = useState("");
  const [recipient, setRecipient] = useState<RecipientInfo | null>(null);
  const [recipientError, setRecipientError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  const [amount, setAmount] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecipient(null);
    setRecipientError("");

    if (!personalNumber.trim()) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLookingUp(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${BASE_URL}/user/lookup?personalNumber=${encodeURIComponent(personalNumber.trim())}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setRecipient({ fullName: data.fullName });
          setRecipientError("");
        } else {
          setRecipient(null);
          setRecipientError("No user found with this personal number.");
        }
      } catch {
        setRecipientError("Lookup failed. Check your connection.");
      } finally {
        setLookingUp(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [personalNumber]);

  const handleSubmit = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!personalNumber.trim()) return setErrorMsg("Enter recipient's personal number.");
    if (!recipient) return setErrorMsg("Recipient not found.");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      return setErrorMsg("Enter a valid amount.");
    if (!pinCode || pinCode.length !== 4) return setErrorMsg("Enter your 4-digit PIN.");

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/transaction/transfer/person`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientPersonalNumber: personalNumber.trim(),
          amount: Number(amount),
          pinCode,
          description,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message ?? "Transfer successful.");
        setPersonalNumber("");
        setRecipient(null);
        setAmount("");
        setPinCode("");
        setDescription("");
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
    <div className="tot">
      <div className="tot__ambient" aria-hidden="true">
        <div className="tot-orb tot-orb--1" />
        <div className="tot-orb tot-orb--2" />
      </div>

      <div className="tot__inner">
        <header className="tot__header">
          <p className="tot__label">Payments</p>
          <h1 className="tot__title">Send Money</h1>
        </header>

        <div className="tot__card">
          <div className="tot__section-label">Recipient</div>

          <div className="tot__recipient-row">
            <div className="tot__field tot__field--grow">
              <label className="tot__field-label">Personal Number</label>
              <input
                className="tot__input"
                type="text"
                placeholder="e.g. 01234567890"
                value={personalNumber}
                onChange={(e) => setPersonalNumber(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className={`tot__recipient-badge ${recipient ? "tot__recipient-badge--found" : ""}`}>
              {lookingUp && <span className="tot__spinner" />}
              {!lookingUp && recipient && (
                <>
                  <span className="tot__recipient-badge-avatar">
                    {recipient.fullName.charAt(0).toUpperCase()}
                  </span>
                  <span className="tot__recipient-badge-name">{recipient.fullName}</span>
                </>
              )}
              {!lookingUp && !recipient && !recipientError && (
                <span className="tot__recipient-badge-placeholder">Name appears here</span>
              )}
              {!lookingUp && recipientError && (
                <span className="tot__recipient-badge-error">{recipientError}</span>
              )}
            </div>
          </div>

          <div className="tot__divider" />

          <div className="tot__section-label">Transfer Details</div>

          <div className="tot__field">
            <label className="tot__field-label">Amount</label>
            <div className="tot__amount-wrap">
              <span className="tot__currency">$</span>
              <input
                className="tot__input tot__input--amount"
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="tot__field">
            <label className="tot__field-label">Description <span className="tot__optional">(optional)</span></label>
            <input
              className="tot__input"
              type="text"
              placeholder="What's this for?"
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="tot__divider" />

          <div className="tot__section-label">Confirmation</div>

          <div className="tot__field">
            <label className="tot__field-label">Your PIN Code</label>
            <input
              className="tot__input tot__input--pin"
              type="password"
              placeholder="••••"
              maxLength={4}
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/, ""))}
              inputMode="numeric"
            />
          </div>

          {errorMsg && <div className="tot__msg tot__msg--error">{errorMsg}</div>}
          {successMsg && <div className="tot__msg tot__msg--success">{successMsg}</div>}

          <button
            className="tot__submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <span className="tot__spinner tot__spinner--btn" /> : "Send Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}