import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import { Modal } from "../components/Modal";
import "../styles/pages.css";

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const cls =
    s === "closed" || s === "resolved"
      ? "mqms-badge mqms-badge--closed"
      : s === "open" || s === "new"
        ? "mqms-badge mqms-badge--open"
        : "mqms-badge";
  return <span className={cls}>{status || "—"}</span>;
}

function normalizeDefect(d) {
  return {
    id: d?._id || d?.id,
    title: d?.title || d?.name || d?.summary || "Untitled defect",
    line: d?.line || d?.productionLine || d?.lineName || "",
    severity: d?.severity || d?.priority || "Medium",
    status: d?.status || "Open",
    createdAt: d?.createdAt || d?.created_at || "",
    raw: d
  };
}

function DefectForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [line, setLine] = useState(initial?.line || "");
  const [severity, setSeverity] = useState(initial?.severity || "Medium");
  const [status, setStatus] = useState(initial?.status || "Open");
  const [description, setDescription] = useState(initial?.raw?.description || "");

  const submit = (e) => {
    e.preventDefault();
    onSave({
      title,
      line,
      severity,
      status,
      description
    });
  };

  return (
    <form onSubmit={submit} className="mqms-grid" style={{ gap: 12 }}>
      <div className="mqms-field">
        <label className="mqms-label">Title</label>
        <input className="mqms-input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="mqms-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        <div className="mqms-field">
          <label className="mqms-label">Line</label>
          <input className="mqms-input" value={line} onChange={(e) => setLine(e.target.value)} />
        </div>
        <div className="mqms-field">
          <label className="mqms-label">Severity</label>
          <select className="mqms-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>
        <div className="mqms-field">
          <label className="mqms-label">Status</label>
          <select className="mqms-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Open</option>
            <option>In Progress</option>
            <option>On Hold</option>
            <option>Closed</option>
          </select>
        </div>
      </div>
      <div className="mqms-field">
        <label className="mqms-label">Description</label>
        <textarea className="mqms-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" className="mqms-btn mqms-btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="mqms-btn">
          Save
        </button>
      </div>
    </form>
  );
}

export default function DefectsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [defects, setDefects] = useState([]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // best-effort endpoint guess
      const res =
        (await apiRequest("/api/defects")) ||
        [];
      const arr = Array.isArray(res) ? res : res?.items || res?.data || [];
      setDefects(arr.map(normalizeDefect));
    } catch (err) {
      setError(err?.message || "Failed to load defects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return defects.filter((d) => {
      const matchesQ =
        !q ||
        d.title.toLowerCase().includes(q.toLowerCase()) ||
        d.line.toLowerCase().includes(q.toLowerCase());
      const matchesStatus = !status || (d.status || "").toLowerCase() === status.toLowerCase();
      const matchesSeverity = !severity || (d.severity || "").toLowerCase() === severity.toLowerCase();
      return matchesQ && matchesStatus && matchesSeverity;
    });
  }, [defects, q, status, severity]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setModalOpen(true);
  };

  const save = async (payload) => {
    setError(null);
    try {
      if (editing?.id) {
        await apiRequest(`/api/defects/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await apiRequest("/api/defects", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err?.message || "Failed to save defect.");
    }
  };

  const remove = async (d) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Delete defect "${d.title}"?`)) return;
    setError(null);
    try {
      await apiRequest(`/api/defects/${d.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err?.message || "Failed to delete defect.");
    }
  };

  return (
    <div>
      <h1 className="mqms-page-title">Defects</h1>
      <p className="mqms-page-subtitle">Log and manage quality defects with filtering and quick edits.</p>

      {error ? <div className="mqms-alert mqms-alert--error">{error}</div> : null}

      <div className="mqms-toolbar">
        <div className="mqms-toolbar__left">
          <div className="mqms-field" style={{ minWidth: 220 }}>
            <label className="mqms-label">Search</label>
            <input className="mqms-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, line..." />
          </div>
          <div className="mqms-field" style={{ minWidth: 160 }}>
            <label className="mqms-label">Status</label>
            <select className="mqms-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>On Hold</option>
              <option>Closed</option>
            </select>
          </div>
          <div className="mqms-field" style={{ minWidth: 160 }}>
            <label className="mqms-label">Severity</label>
            <select className="mqms-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="">All</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>
        </div>

        <div className="mqms-toolbar__right">
          <button className="mqms-btn" onClick={openCreate}>
            + New defect
          </button>
        </div>
      </div>

      <div className="mqms-card">
        <div className="mqms-card__header">
          <div>
            <div className="mqms-card__title">{loading ? "Loading…" : `${filtered.length} defect(s)`}</div>
            <div className="mqms-card__subtitle">Click a defect to view RCA and status history.</div>
          </div>
        </div>

        <div className="mqms-card__body" style={{ paddingTop: 0 }}>
          <table className="mqms-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Line</th>
                <th>Severity</th>
                <th>Status</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link to={`/app/defects/${d.id}`} style={{ color: "inherit", fontWeight: 800, textDecoration: "none" }}>
                      {d.title}
                    </Link>
                  </td>
                  <td>{d.line || "—"}</td>
                  <td>{d.severity}</td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="mqms-btn mqms-btn--ghost" onClick={() => openEdit(d)}>
                        Edit
                      </button>
                      <button className="mqms-btn mqms-btn--danger" onClick={() => remove(d)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: "var(--text-muted)" }}>
                    No defects match your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen ? (
        <Modal
          title={editing ? "Edit defect" : "New defect"}
          onClose={() => setModalOpen(false)}
          size="md"
        >
          <DefectForm initial={editing} onSave={save} onCancel={() => setModalOpen(false)} />
        </Modal>
      ) : null}
    </div>
  );
}
