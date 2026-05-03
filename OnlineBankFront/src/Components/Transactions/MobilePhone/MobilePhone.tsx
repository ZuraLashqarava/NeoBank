import React, { useState, useEffect, useRef } from "react";
import "./MobilePhone.scss";

const BASE_URL = "https://localhost:7096/api";

interface CallingCode {
  name: string;
  code: string;
  flag: string;
}

export default function MobilePhone() {
  const [countries, setCountries] = useState<CallingCode[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);

  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CallingCode | null>(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/country/calling-codes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: CallingCode[] = await res.json();
          setCountries(data);
          const georgia = data.find((c) => c.name === "Georgia");
          if (georgia) setSelectedCountry(georgia);
        }
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCodes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
  );

  const handleSelectCountry = (country: CallingCode) => {
    setSelectedCountry(country);
    setDropdownOpen(false);
    setSearch("");
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedCountry) return setErrorMsg("Select a country code.");
    if (!phoneNumber.trim()) return setErrorMsg("Enter a phone number.");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return setErrorMsg("Enter a valid amount.");
    if (!pinCode || pinCode.length !== 4) return setErrorMsg("Enter your 4-digit PIN.");

    const fullNumber = `${selectedCountry.code}${phoneNumber.trim()}`;

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
          category: 7,
          recipientLabel: fullNumber,
          description: `Mobile top-up · ${fullNumber}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message ?? "Payment successful.");
        setPhoneNumber("");
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
    <div className="mob">
      <div className="mob__ambient" aria-hidden="true">
        <div className="mob-orb mob-orb--1" />
        <div className="mob-orb mob-orb--2" />
      </div>

      <div className="mob__inner">
        <header className="mob__header">
          <p className="mob__label">Payments</p>
          <h1 className="mob__title">Mobile Phone</h1>
        </header>

        <div className="mob__card">
          <div className="mob__section-label">Phone Number</div>

          <div className="mob__field">
            <label className="mob__field-label">Country Code</label>
            <div className="mob__dropdown" ref={dropdownRef}>
              <button
                className="mob__dropdown-trigger"
                onClick={() => setDropdownOpen((o) => !o)}
                disabled={loadingCountries}
              >
                {loadingCountries ? (
                  <span className="mob__spinner" />
                ) : selectedCountry ? (
                  <>
                    <span className="mob__flag">{selectedCountry.flag}</span>
                    <span className="mob__code">{selectedCountry.code}</span>
                    <span className="mob__country-name">{selectedCountry.name}</span>
                  </>
                ) : (
                  <span className="mob__placeholder">Select country...</span>
                )}
                <span className="mob__dropdown-arrow">▾</span>
              </button>

              {dropdownOpen && (
                <div className="mob__dropdown-menu">
                  <div className="mob__dropdown-search-wrap">
                    <input
                      className="mob__dropdown-search"
                      type="text"
                      placeholder="Search country or code..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="mob__dropdown-list">
                    {filtered.length === 0 ? (
                      <div className="mob__dropdown-empty">No results</div>
                    ) : (
                      filtered.map((c) => (
                        <button
                          key={`${c.name}-${c.code}`}
                          className={`mob__dropdown-item ${selectedCountry?.name === c.name ? "mob__dropdown-item--active" : ""}`}
                          onClick={() => handleSelectCountry(c)}
                        >
                          <span className="mob__flag">{c.flag}</span>
                          <span className="mob__dropdown-item-code">{c.code}</span>
                          <span className="mob__dropdown-item-name">{c.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mob__field">
            <label className="mob__field-label">Phone Number</label>
            <div className="mob__phone-wrap">
              {selectedCountry && (
                <span className="mob__phone-prefix">{selectedCountry.code}</span>
              )}
              <input
                className={`mob__input ${selectedCountry ? "mob__input--with-prefix" : ""}`}
                type="tel"
                placeholder="555 000 000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s\-]/g, ""))}
                inputMode="tel"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="mob__divider" />

          <div className="mob__section-label">Payment Details</div>

          <div className="mob__field">
            <label className="mob__field-label">Amount</label>
            <div className="mob__amount-wrap">
              <span className="mob__currency">$</span>
              <input
                className="mob__input mob__input--amount"
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="mob__divider" />

          <div className="mob__section-label">Confirmation</div>

          <div className="mob__field">
            <label className="mob__field-label">Your PIN Code</label>
            <input
              className="mob__input mob__input--pin"
              type="password"
              placeholder="••••"
              maxLength={4}
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
            />
          </div>

          {errorMsg && <div className="mob__msg mob__msg--error">{errorMsg}</div>}
          {successMsg && <div className="mob__msg mob__msg--success">{successMsg}</div>}

          <button
            className="mob__submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <span className="mob__spinner mob__spinner--btn" /> : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}