import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.scss";

export default function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = () => setIsLoggedIn(!!localStorage.getItem("token"));
    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("authChange", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("authChange", checkAuth);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setDropdownOpen(false);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar__brand" onClick={() => navigate("/")}>
        NEO BANK
      </div>

      <div className="navbar__links">
        <NavLink
          to="/my-space"
          className={({ isActive }) => `navbar__link ${isActive ? "navbar__link--active" : ""}`}
        >
          My Space
        </NavLink>
        <NavLink
          to="/transactions"
          className={({ isActive }) => `navbar__link ${isActive ? "navbar__link--active" : ""}`}
        >
          Transactions
        </NavLink>
        <NavLink
          to="/stock-market"
          className={({ isActive }) => `navbar__link ${isActive ? "navbar__link--active" : ""}`}
        >
          Stock Market
        </NavLink>
      </div>

      <div className="navbar__actions">
        {isLoggedIn ? (
          <div className="navbar__account" ref={dropdownRef}>
            <button
              className={`navbar__account-btn ${dropdownOpen ? "navbar__account-btn--open" : ""}`}
              onClick={() => setDropdownOpen((p) => !p)}
              aria-label="Account menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="navbar__dropdown">
                <button
                  className="navbar__dropdown-item"
                  onClick={() => { setDropdownOpen(false); navigate("/my-space"); }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="5" width="20" height="14" rx="3" />
                    <path d="M2 10h20" />
                  </svg>
                  Balance
                </button>

                <button
                  className="navbar__dropdown-item"
                  onClick={() => { setDropdownOpen(false); navigate("/settings"); }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </button>

                <div className="navbar__dropdown-divider" />

                <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="navbar__login-btn" onClick={() => navigate("/login")}>
            Login
          </button>
        )}
      </div>
    </nav>
  );
}