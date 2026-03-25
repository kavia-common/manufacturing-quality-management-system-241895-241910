import React from "react";
import { Link } from "react-router-dom";
import "../styles/pages.css";

export default function NotFoundPage() {
  return (
    <div className="mqms-card">
      <div className="mqms-card__header">
        <div>
          <div className="mqms-card__title">Page not found</div>
          <div className="mqms-card__subtitle">The page you requested doesn’t exist.</div>
        </div>
      </div>
      <div className="mqms-card__body">
        <Link to="/app/dashboard" style={{ textDecoration: "none", fontWeight: 900, color: "var(--primary)" }}>
          Go to Dashboard →
        </Link>
      </div>
    </div>
  );
}
