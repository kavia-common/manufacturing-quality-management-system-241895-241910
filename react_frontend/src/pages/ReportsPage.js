import React, { useState } from "react";
import { apiDownload } from "../services/api";
import "../styles/pages.css";

export default function ReportsPage() {
  const [defectId, setDefectId] = useState("");
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setError(null);
    setDownloading(true);
    try {
      if (!defectId.trim()) {
        // generic report
        await apiDownload("/api/reports/audit.pdf", "audit-report.pdf");
      } else {
        await apiDownload(`/api/defects/${defectId}/report.pdf`, `defect-${defectId}-report.pdf`);
      }
    } catch (err) {
      setError(err?.message || "Failed to download report.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <h1 className="mqms-page-title">Reports</h1>
      <p className="mqms-page-subtitle">Generate audit-ready PDF reports for defects and system activity.</p>

      {error ? <div className="mqms-alert mqms-alert--error">{error}</div> : null}

      <div className="mqms-card" style={{ marginTop: 12 }}>
        <div className="mqms-card__header">
          <div>
            <div className="mqms-card__title">PDF export</div>
            <div className="mqms-card__subtitle">Provide a defect ID for a detailed defect report, or leave blank for an audit report.</div>
          </div>
        </div>
        <div className="mqms-card__body">
          <div className="mqms-grid" style={{ gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
            <div className="mqms-field">
              <label className="mqms-label">Defect ID (optional)</label>
              <input className="mqms-input" value={defectId} onChange={(e) => setDefectId(e.target.value)} placeholder="e.g. 65b..." />
            </div>
            <button className="mqms-btn" onClick={download} disabled={downloading}>
              {downloading ? "Preparing…" : "Download PDF"}
            </button>
          </div>

          <div style={{ marginTop: 12, color: "var(--text-muted)", fontWeight: 800, fontSize: 12 }}>
            Expected endpoints: <code>/api/reports/audit.pdf</code> or <code>/api/defects/:id/report.pdf</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
