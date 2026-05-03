import React, { useState } from "react";
import "./Charity.scss";

const BASE_URL = "https://localhost:7096/api";

interface Organization {
  id: string;
  label: string;
  icon: string;
}

const ORGANIZATIONS: Organization[] = [
  { id: "unicef",     label: "UNICEF",     icon: "Unicef.png" },
  { id: "redcross",   label: "Red Cross",  icon: "Redcross.png" },
  { id: "wwf",        label: "WWF",        icon: "WWF.png" },
  { id: "oxfam",      label: "OXFAM",      icon: "Oxfam.png" },
  { id: "bluestar",   label: "Blue Star",  icon: "Bluestar.png" },
  { id: "lifeboats",  label: "Life Boats", icon: "Lifeboats.Jpeg" },
];

export default function Charity() {
  const [selected, setSelected] = useState<Organization | null>(null);
  const [amount, setAmount] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSelect = (org: Organization) => {
    setSelected(org);
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
          category: 6,
          recipientLabel: selected!.label,
          description: `Donation · ${selected!.label}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message ?? "Donation successful.");
        setAmount("");
        setPinCode("");
      } else {
        setErrorMsg(data.message ?? "Donation failed.");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="charity">
      <div className="charity__ambient" aria-hidden="true">
        <div className="charity-orb charity-orb--1" />
        <div className="charity-orb charity-orb--2" />
      </div>

      <div className="charity__inner">
        <header className="charity__header">
          <p className="charity__label">Payments</p>
          <h1 className="charity__title">Charity</h1>
        </header>

        <div className="charity__section-label">Select Organization</div>

        <div className="charity__grid">
          {ORGANIZATIONS.map((org) => (
            <button
              key={org.id}
              className={`charity__card ${selected?.id === org.id ? "charity__card--active" : ""}`}
              onClick={() => handleSelect(org)}
            >
              <div className="charity__card-img">
                <img
                  src={`/src/assets/${org.icon}`}
                  alt={org.label}
                  className="charity__card-icon"
                />
              </div>
              <span className="charity__card-label">{org.label}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div className="charity__panel" key={selected.id}>
            <div className="charity__panel-header">
              <span className="charity__panel-title">Donate to {selected.label}</span>
              <button className="charity__panel-close" onClick={handleClose} aria-label="Close">✕</button>
            </div>

            <div className="charity__panel-body">
              <div className="charity__field">
                <label className="charity__field-label">Amount</label>
                <div className="charity__amount-wrap">
                  <span className="charity__currency">$</span>
                  <input
                    className="charity__input charity__input--amount"
                    type="number"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="charity__field">
                <label className="charity__field-label">Your PIN Code</label>
                <input
                  className="charity__input charity__input--pin"
                  type="password"
                  placeholder="••••"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                />
              </div>

              {errorMsg && <div className="charity__msg charity__msg--error">{errorMsg}</div>}
              {successMsg && <div className="charity__msg charity__msg--success">{successMsg}</div>}

              <button
                className="charity__submit"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <span className="charity__spinner charity__spinner--btn" /> : "Donate Now"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}