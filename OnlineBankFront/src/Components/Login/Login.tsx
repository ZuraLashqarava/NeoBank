import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.scss";

type Mode = "login" | "register";

interface RegisterPayload {
  fullName: string;
  email: string;
  personalNumber: string;
  password: string;
  cardHolderName: string;
  cardNumber: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

const API_BASE = "https://localhost:7096/api";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [personalNumber, setPersonalNumber] = useState("");
  const [password, setPassword] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setError("");
    setSuccess("");
  }, [mode]);

  const handleModeSwitch = (next: Mode) => {
    if (next === mode || animating) return;
    setAnimating(true);
    setTimeout(() => {
      setMode(next);
      setAnimating(false);
    }, 300);
  };

  const validateRegister = (): string => {
    if (!firstName.trim() || !lastName.trim()) return "First and last name are required.";
    if (!/^\d{11}$/.test(personalNumber)) return "Personal number must be exactly 11 digits.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
    if (password.length < 8 || !/\d/.test(password)) return "Password must be at least 8 characters and contain a number.";
    if (!cardHolderName.trim()) return "Card holder name is required.";
    if (!/^\d{16}$/.test(cardNumber)) return "Card number must be exactly 16 digits.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "register") {
      const validationError = validateRegister();
      if (validationError) { setError(validationError); return; }
    }

    setLoading(true);

    try {
      if (mode === "register") {
        const payload: RegisterPayload = {
          fullName: `${firstName.trim()} ${lastName.trim()}`,
          email,
          personalNumber,
          password,
          cardHolderName: cardHolderName.trim(),
          cardNumber,
        };

        const res = await fetch(`${API_BASE}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed.");

        localStorage.setItem("token", data.token);
        window.dispatchEvent(new Event("authChange"));
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("fullName", data.fullName);
        localStorage.setItem("email", data.email);

        navigate("/");
      } else {
        const payload: LoginPayload = { email, password };

        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed.");

        localStorage.setItem("token", data.token);
        window.dispatchEvent(new Event("authChange"));
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("fullName", data.fullName);
        localStorage.setItem("email", data.email);

        navigate("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    setCardNumber(digits);
  };

  return (
    <div className="auth-page">
      <div className="auth-page__glow auth-page__glow--1" />
      <div className="auth-page__glow auth-page__glow--2" />

      <div className="auth-card">
        <div className="auth-card__brand">
          <span className="auth-card__brand-icon">◈</span>
          <span className="auth-card__brand-name">NeoBank</span>
        </div>

        <div className="auth-card__tabs">
          <button
            className={`auth-card__tab ${mode === "register" ? "auth-card__tab--active" : ""}`}
            onClick={() => handleModeSwitch("register")}
            type="button"
          >
            Register
          </button>
          <button
            className={`auth-card__tab ${mode === "login" ? "auth-card__tab--active" : ""}`}
            onClick={() => handleModeSwitch("login")}
            type="button"
          >
            Login
          </button>
          <span
            className="auth-card__tab-indicator"
            style={{ transform: mode === "login" ? "translateX(100%)" : "translateX(0%)" }}
          />
        </div>

        <div className={`auth-card__body ${animating ? "auth-card__body--exit" : "auth-card__body--enter"}`}>
          <div className="auth-card__header">
            <h2 className="auth-card__title">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="auth-card__subtitle">
              {mode === "login" ? "Sign in to your NeoBank account" : "Open your NeoBank account today"}
            </p>
          </div>

          <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
            {mode === "register" && (
              <>
                <div className="auth-field auth-field--split">
                  <div className="auth-field__group">
                    <label className="auth-field__label">First Name</label>
                    <input
                      className="auth-field__input"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="auth-field__group">
                    <label className="auth-field__label">Last Name</label>
                    <input
                      className="auth-field__input"
                      type="text"
                      placeholder="Smith"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-field__label">Personal Number</label>
                  <input
                    className="auth-field__input"
                    type="text"
                    inputMode="numeric"
                    placeholder="11-digit personal number"
                    maxLength={11}
                    value={personalNumber}
                    onChange={(e) => setPersonalNumber(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                  <span className="auth-field__hint">{personalNumber.length}/11</span>
                </div>
              </>
            )}

            <div className="auth-field">
              <label className="auth-field__label">Email</label>
              <input
                className="auth-field__input"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-field__label">Password</label>
              <div className="auth-field__password-wrap">
                <input
                  className="auth-field__input"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-field__eye"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {mode === "register" && (
                <span className="auth-field__hint">Min 8 characters, at least 1 number</span>
              )}
            </div>

            {mode === "register" && (
              <>
                <div className="auth-field__divider">
                  <span>External Card</span>
                </div>

                <div className="auth-field">
                  <label className="auth-field__label">Card Holder Name</label>
                  <input
                    className="auth-field__input"
                    type="text"
                    placeholder="John Smith"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-field__label">Card Number</label>
                  <input
                    className="auth-field__input auth-field__input--card"
                    type="text"
                    inputMode="numeric"
                    placeholder="1234 5678 9012 3456"
                    maxLength={16}
                    value={cardNumber}
                    onChange={(e) => formatCardNumber(e.target.value)}
                    required
                  />
                  <span className="auth-field__hint">{cardNumber.length}/16</span>
                </div>
              </>
            )}

            {error && <p className="auth-card__error">{error}</p>}
            {success && <p className="auth-card__success">{success}</p>}

            <button type="submit" className="auth-card__submit" disabled={loading}>
              {loading ? (
                <span className="auth-card__spinner" />
              ) : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="auth-card__switch">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            <button
              className="auth-card__switch-btn"
              type="button"
              onClick={() => handleModeSwitch(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Register" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}