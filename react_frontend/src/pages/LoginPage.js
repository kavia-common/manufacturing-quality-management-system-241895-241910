import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/pages.css";

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("quality@example.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/app/dashboard";

  if (isAuthenticated) return <Navigate to={from} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mqms-auth">
      <div className="mqms-auth-card">
        <div className="mqms-auth-title">Sign in</div>
        <div className="mqms-auth-subtitle">Quality Management System</div>

        {error ? <div className="mqms-alert mqms-alert--error">{error}</div> : null}

        <form onSubmit={onSubmit} className="mqms-grid" style={{ gap: 12 }}>
          <div className="mqms-field">
            <label className="mqms-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="mqms-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="mqms-field">
            <label className="mqms-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="mqms-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button className="mqms-btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="mqms-auth-help">
            Configure API base URL via <code>REACT_APP_API_BASE_URL</code> if needed.
          </div>
        </form>
      </div>
    </div>
  );
}
