import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import { Modal } from "../components/Modal";
import "../styles/pages.css";

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleString();
}

function WhyEditor({ value, onChange }) {
  return (
    <div className="mqms-grid" style={{ gap: 10 }}>
      {value.map((w, idx) => (
        <div key={idx} className="mqms-field">
          <label className="mqms-label">{`Why #${idx + 1}`}</label>
          <input
            className="mqms-input"
            value={w}
            onChange={(e) => {
              const next = [...value];
              next[idx] = e.target.value;
              onChange(next);
            }}
            placeholder="Describe the cause at this level"
          />
        </div>
      ))}
    </div>
  );
}

export default function DefectDetailPage() {
  const { id } = useParams();
  const [defect, setDefect] = useState(null);
  const [history, setHistory] = useState([]);
  const [rca, setRca] = useState(null);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [rcaModal, setRcaModal] = useState(false);
  const [whys, setWhys] = useState(["", "", "", "", ""]);
  const [rootCause, setRootCause] = useState("");
  const [containment, setContainment] = useState("");

  const [statusModal, setStatusModal] = useState(false);
  const [nextStatus, setNextStatus] = useState("In Progress");
  const [statusNote, setStatusNote] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await apiRequest(`/api/defects/${id}`);
      setDefect(d);

      // best-effort endpoints
      const r = await apiRequest(`/api/defects/${id}/rca`).catch(() => null);
      setRca(r);

      const h = await apiRequest(`/api/defects/${id}/status-history`).catch(() => []);
      const arr = Array.isArray(h) ? h : h?.items || h?.data || [];
      setHistory(arr);

      if (r?.whys && Array.isArray(r.whys)) setWhys((r.whys.concat(["", "", "", "", ""])).slice(0, 5));
      if (r?.rootCause) setRootCause(r.rootCause);
      if (r?.containment) setContainment(r.containment);
    } catch (err) {
      setError(err?.message || "Failed to load defect.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const title = defect?.title || defect?.name || defect?.summary || `Defect ${id}`;
  const status = defect?.status || "—";

  const rcaSummary = useMemo(() => {
    if (!rca) return "No RCA submitted yet.";
    const rc = rca?.rootCause || "—";
    return `Root cause: ${rc}`;
  }, [rca]);

  const saveRca = async () => {
    setError(null);
    try {
      await apiRequest(`/api/defects/${id}/rca`, {
        method: "POST",
        body: JSON.stringify({
          whys,
          rootCause,
          containment
        })
      });
      setRcaModal(false);
      await load();
    } catch (err) {
      setError(err?.message || "Failed to save RCA.");
    }
  };

  const updateStatus = async () => {
    setError(null);
    try {
      await apiRequest(`/api/defects/${id}/status`, {
        method: "POST",
        body: JSON.stringify({
          status: nextStatus,
          note: statusNote
        })
      });
      setStatusModal(false);
      setStatusNote("");
      await load();
    } catch (err) {
      setError(err?.message || "Failed to update status.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 className="mqms-page-title">{loading ? "Loading…" : title}</h1>
          <p className="mqms-page-subtitle">
            <Link to="/app/defects" style={{ color: "var(--primary)", fontWeight: 800, textDecoration: "none" }}>
              ← Back to defects
            </Link>{" "}
            · Current status: <strong>{status}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="mqms-btn mqms-btn--ghost" onClick={() => setStatusModal(true)}>
            Update status
          </button>
          <button className="mqms-btn" onClick={() => setRcaModal(true)}>
            Edit RCA (5-Why)
          </button>
        </div>
      </div>

      {error ? <div className="mqms-alert mqms-alert--error">{error}</div> : null}

      <div className="mqms-grid" style={{ gridTemplateColumns: "1.2fr 0.8fr", gap: 12, marginTop: 12 }}>
        <div className="mqms-card">
          <div className="mqms-card__header">
            <div>
              <div className="mqms-card__title">Root Cause Analysis</div>
              <div className="mqms-card__subtitle">{rcaSummary}</div>
            </div>
          </div>
          <div className="mqms-card__body">
            <div className="mqms-grid" style={{ gap: 10 }}>
              {(rca?.whys || []).slice(0, 5).map((w, idx) => (
                <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className="mqms-badge">{`Why #${idx + 1}`}</span>
                  <div style={{ color: w ? "var(--text)" : "var(--text-muted)", fontWeight: 700 }}>
                    {w || "—"}
                  </div>
                </div>
              ))}
              <div>
                <div className="mqms-label">Containment / immediate action</div>
                <div style={{ marginTop: 6, color: containment || rca?.containment ? "var(--text)" : "var(--text-muted)", fontWeight: 700 }}>
                  {rca?.containment || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mqms-card">
          <div className="mqms-card__header">
            <div>
              <div className="mqms-card__title">Status History</div>
              <div className="mqms-card__subtitle">Real-time tracking (latest on top)</div>
            </div>
          </div>
          <div className="mqms-card__body">
            <div className="mqms-grid" style={{ gap: 10 }}>
              {history.map((h, idx) => (
                <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 10 }}>
                  <div style={{ fontWeight: 900 }}>{h?.status || h?.toStatus || "—"}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{formatDate(h?.at || h?.createdAt || h?.timestamp)}</div>
                  {h?.note ? <div style={{ marginTop: 6, fontWeight: 700 }}>{h.note}</div> : null}
                </div>
              ))}
              {history.length === 0 ? <div style={{ color: "var(--text-muted)", fontWeight: 700 }}>No status updates yet.</div> : null}
            </div>
          </div>
        </div>
      </div>

      {rcaModal ? (
        <Modal
          title="RCA (5-Why)"
          size="lg"
          onClose={() => setRcaModal(false)}
          footer={
            <>
              <button className="mqms-btn mqms-btn--ghost" onClick={() => setRcaModal(false)}>
                Cancel
              </button>
              <button className="mqms-btn" onClick={saveRca}>
                Save RCA
              </button>
            </>
          }
        >
          <div className="mqms-grid" style={{ gap: 12 }}>
            <WhyEditor value={whys} onChange={setWhys} />
            <div className="mqms-field">
              <label className="mqms-label">Root cause (summary)</label>
              <input className="mqms-input" value={rootCause} onChange={(e) => setRootCause(e.target.value)} />
            </div>
            <div className="mqms-field">
              <label className="mqms-label">Containment / immediate action</label>
              <textarea className="mqms-textarea" value={containment} onChange={(e) => setContainment(e.target.value)} />
            </div>
          </div>
        </Modal>
      ) : null}

      {statusModal ? (
        <Modal
          title="Update status"
          size="md"
          onClose={() => setStatusModal(false)}
          footer={
            <>
              <button className="mqms-btn mqms-btn--ghost" onClick={() => setStatusModal(false)}>
                Cancel
              </button>
              <button className="mqms-btn" onClick={updateStatus}>
                Update
              </button>
            </>
          }
        >
          <div className="mqms-grid" style={{ gap: 12 }}>
            <div className="mqms-field">
              <label className="mqms-label">New status</label>
              <select className="mqms-select" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                <option>Open</option>
                <option>In Progress</option>
                <option>On Hold</option>
                <option>Closed</option>
              </select>
            </div>
            <div className="mqms-field">
              <label className="mqms-label">Note</label>
              <textarea className="mqms-textarea" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="What changed? Evidence?" />
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
