import React, { useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { APP_NAME } from "../config";
import { useAuth } from "../contexts/AuthContext";
import "./shell.css";

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `mqms-nav-item ${isActive ? "is-active" : ""}`}
      end
    >
      {label}
    </NavLink>
  );
}

// PUBLIC_INTERFACE
export function AppShell() {
  /** Main authenticated layout with sidebar navigation. */
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleLabel = useMemo(() => {
    const role = user?.role || user?.roles?.[0] || user?.claim?.role;
    return role ? String(role) : "User";
  }, [user]);

  return (
    <div className="mqms-shell">
      <div className={`mqms-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="mqms-sidebar__brand">
          <div className="mqms-brand-dot" aria-hidden="true" />
          <div className="mqms-brand-text">
            <div className="mqms-brand-title">{APP_NAME}</div>
            <div className="mqms-brand-subtitle">{roleLabel}</div>
          </div>
        </div>

        <nav className="mqms-nav" aria-label="Primary">
          <NavItem to="/app/dashboard" label="Dashboard" />
          <NavItem to="/app/defects" label="Defects" />
          <NavItem to="/app/corrective-actions" label="Corrective Actions" />
          <NavItem to="/app/reports" label="Reports" />
        </nav>

        <div className="mqms-sidebar__footer">
          <button className="mqms-btn mqms-btn--ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>

      {sidebarOpen ? (
        <div className="mqms-scrim" onClick={() => setSidebarOpen(false)} role="presentation" />
      ) : null}

      <div className="mqms-main">
        <header className="mqms-topbar">
          <button
            className="mqms-btn mqms-btn--ghost mqms-topbar__menu"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <div className="mqms-topbar__right">
            <div className="mqms-user-pill" title={user?.email || ""}>
              {user?.name || user?.email || "Signed in"}
            </div>
          </div>
        </header>

        <main className="mqms-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
