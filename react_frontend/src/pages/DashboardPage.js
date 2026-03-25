import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";
import "../styles/pages.css";

function Sparkline({ data = [], color = "var(--primary)" }) {
  const w = 260;
  const h = 44;
  const pts = data.length ? data : [0, 0, 0, 0, 0];
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;

  const d = pts
    .map((v, i) => {
      const x = (i / (pts.length - 1 || 1)) * (w - 8) + 4;
      const y = h - ((v - min) / range) * (h - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} aria-label="Trend sparkline" role="img">
      <polyline fill="none" stroke={color} strokeWidth="3" points={d} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function BarPareto({ items = [] }) {
  const max = Math.max(...items.map((x) => x.count), 1);
  return (
    <div className="mqms-grid" style={{ gap: 8 }}>
      {items.slice(0, 8).map((it) => (
        <div key={it.label} style={{ display: "grid", gridTemplateColumns: "160px 1fr 48px", gap: 10, alignItems: "center" }}>
          <div style={{ fontWeight: 900 }}>{it.label}</div>
          <div style={{ height: 10, borderRadius: 999, background: "rgba(100,116,139,0.12)", overflow: "hidden" }}>
            <div
              style={{
                width: `${(it.count / max) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, var(--primary), var(--success))"
              }}
            />
          </div>
          <div style={{ textAlign: "right", color: "var(--text-muted)", fontWeight: 900 }}>{it.count}</div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const res = await apiRequest("/api/dashboards/summary").catch(() => apiRequest("/api/dashboard/summary"));
        setKpis(res);
      } catch (err) {
        // fallback to derived metrics if endpoint not present
        try {
          const defectsRes = await apiRequest("/api/defects");
          const arr = Array.isArray(defectsRes) ? defectsRes : defectsRes?.items || defectsRes?.data || [];
          const open = arr.filter((d) => String(d.status || "").toLowerCase() !== "closed").length;
          const closed = arr.length - open;

          setKpis({
            totalDefects: arr.length,
            openDefects: open,
            closedDefects: closed,
            trend: arr.slice(-8).map((_, i) => Math.max(0, open - i)),
            pareto: []
          });
        } catch (e2) {
          setError(err?.message || "Failed to load dashboard data.");
        }
      }
    };
    load();
  }, []);

  const paretoItems = useMemo(() => {
    const p = kpis?.pareto || kpis?.paretoByType || [];
    const arr = Array.isArray(p) ? p : [];
    // support shapes: {label,count} or {type,count}
    return arr
      .map((x) => ({ label: x.label || x.type || x.name || "Unknown", count: x.count || x.value || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [kpis]);

  const trend = useMemo(() => {
    const t = kpis?.trend || kpis?.weeklyTrend || kpis?.monthlyTrend || [];
    if (!Array.isArray(t)) return [];
    return t.map((x) => (typeof x === "number" ? x : x.count || x.value || 0)).slice(-10);
  }, [kpis]);

  return (
    <div>
      <h1 className="mqms-page-title">Dashboard</h1>
      <p className="mqms-page-subtitle">KPIs, Pareto concentration, and trend monitoring.</p>

      {error ? <div className="mqms-alert mqms-alert--error">{error}</div> : null}

      <div className="mqms-grid mqms-kpis" style={{ marginTop: 12 }}>
        <div className="mqms-card">
          <div className="mqms-card__header">
            <div className="mqms-card__title">Total Defects</div>
            <span className="mqms-badge">KPI</span>
          </div>
          <div className="mqms-card__body">
            <div style={{ fontSize: 28, fontWeight: 950 }}>{kpis?.totalDefects ?? "—"}</div>
            <div style={{ marginTop: 6 }}>
              <Sparkline data={trend} />
            </div>
          </div>
        </div>

        <div className="mqms-card">
          <div className="mqms-card__header">
            <div className="mqms-card__title">Open</div>
            <span className="mqms-badge mqms-badge--open">Attention</span>
          </div>
          <div className="mqms-card__body">
            <div style={{ fontSize: 28, fontWeight: 950 }}>{kpis?.openDefects ?? "—"}</div>
            <div style={{ marginTop: 6 }}>
              <Sparkline data={trend} color="var(--danger)" />
            </div>
          </div>
        </div>

        <div className="mqms-card">
          <div className="mqms-card__header">
            <div className="mqms-card__title">Closed</div>
            <span className="mqms-badge mqms-badge--closed">Stable</span>
          </div>
          <div className="mqms-card__body">
            <div style={{ fontSize: 28, fontWeight: 950 }}>{kpis?.closedDefects ?? "—"}</div>
            <div style={{ marginTop: 6 }}>
              <Sparkline data={trend.map((x) => Math.max(0, x - 1))} color="var(--success)" />
            </div>
          </div>
        </div>

        <div className="mqms-card">
          <div className="mqms-card__header">
            <div className="mqms-card__title">Overdue Actions</div>
            <span className="mqms-badge">Risk</span>
          </div>
          <div className="mqms-card__body">
            <div style={{ fontSize: 28, fontWeight: 950 }}>{kpis?.overdueActions ?? "—"}</div>
            <div style={{ color: "var(--text-muted)", fontWeight: 800, marginTop: 6 }}>
              Escalate when overdue persists.
            </div>
          </div>
        </div>
      </div>

      <div className="mqms-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <div className="mqms-card">
          <div className="mqms-card__header">
            <div>
              <div className="mqms-card__title">Pareto (Top defect categories)</div>
              <div className="mqms-card__subtitle">Where defects concentrate</div>
            </div>
          </div>
          <div className="mqms-card__body">
            {paretoItems.length ? (
              <BarPareto items={paretoItems} />
            ) : (
              <div style={{ color: "var(--text-muted)", fontWeight: 800 }}>
                Pareto data not available (backend endpoint optional).
              </div>
            )}
          </div>
        </div>

        <div className="mqms-card">
          <div className="mqms-card__header">
            <div>
              <div className="mqms-card__title">Trend Notes</div>
              <div className="mqms-card__subtitle">Operational focus</div>
            </div>
          </div>
          <div className="mqms-card__body">
            <div style={{ fontWeight: 800, color: "var(--text-muted)" }}>
              Use Pareto to prioritize RCA. Use trend to confirm corrective action effectiveness.
            </div>
            <ul style={{ marginTop: 10, color: "var(--text)", fontWeight: 700, lineHeight: 1.6 }}>
              <li>Investigate spikes within 24h</li>
              <li>Track containment vs. permanent fix</li>
              <li>Review overdue actions daily</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
