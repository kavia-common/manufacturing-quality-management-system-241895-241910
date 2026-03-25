import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";
import { Modal } from "../components/Modal";
import "../styles/pages.css";

function isOverdue(item) {
  const due = item?.dueDate || item?.due || item?.targetDate;
  if (!due) return false;
  const dt = new Date(due);
  if (Number.isNaN(dt.getTime())) return false;
  const status = (item?.status || "").toLowerCase();
  if (status === "closed" || status === "done" || status === "completed") return false;
  return dt.getTime() < Date.now();
}

function normalize(ca) {
  return {
    id: ca?._id || ca?.id,
    title: ca?.title || ca?.action || ca?.summary || "Corrective action",
    owner: ca?.owner || ca?.assignee || ca?.assignedTo || "—",
    dueDate: ca?.dueDate || ca?.due || ca?.targetDate || "",
    status: ca?.status || "Open",
    defectId: ca?.defectId || ca?.defect || ca?.defect_id || "",
    raw: ca
  };
}

function CAForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [owner, setOwner] = useState(initial?.owner || "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ? String(initial.dueDate).slice(0, 10) : "");
  const [status, setStatus] = useState(initial?.status || "Open");
  const [defectId, setDefectId] = useState(initial?.defectId || "");

  const submit = (e) => {
    e.preventDefault();
    onSave({ title, owner, dueDate, status, defectId });
  };

  return (
    <form onSubmit={submit} className="mqms-grid" style={{ gap: 12 }}>
      <div className="mqms-field">
        <label className="mqms-label">Title</label>
        <input className="mqms-input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="mqms-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <div className="mqms-field">
          <label className="mqms-label">Owner</label>
          <input className="mqms-input" value={owner} onChange={(e) => setOwner(e.target.value)} />
        </div>
        <div className="mqms-field">
          <label className="mqms-label">Due date</label>
          <input className="mqms-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <div className="mqms-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <div className="mqms-field">
          <label className="mqms-label">Status</label>
          <select className="mqms-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Open</option>
            <option>In Progress</option>
            <option>Blocked</option>
            <option>Done</option>
          </select>
        </div>
        <div className="mqms-field">
          <label className="mqms-label">Related defect ID (optional)</label>
          <input className="mqms-input" value={defectId} onChange={(e) => setDefectId(e.target.value)} placeholder="e.g. 65b..." />
        </div>
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

export default function CorrectiveActionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [q, setQ] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest("/api/corrective-actions").catch(() => apiRequest("/api/correctiveActions"));
      const arr = Array.isArray(res) ? res : res?.items || res?.data || [];
      setItems(arr.map(normalize));
    } catch (err) {
      setError(err?.message || "Failed to load corrective actions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchesQ =
        !q ||
        it.title.toLowerCase().includes(q.toLowerCase()) ||
        String(it.owner).toLowerCase().includes(q.toLowerCase()) ||
        String(it.defectId).toLowerCase().includes(q.toLowerCase());
      const matchesOverdue = !onlyOverdue || isOverdue(it);
      return matchesQ && matchesOverdue;
    });
  }, [items, q, onlyOverdue]);

  const save = async (payload) => {
    setError(null);
    try {
      if (editing?.id) {
        await apiRequest(`/api/corrective-actions/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        }).catch(() =>
          apiRequest(`/api/correctiveActions/${editing.id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
          })
        );
      } else {
        await apiRequest("/api/corrective-actions", {
          method: "POST",
          body: JSON.stringify(payload)
        }).catch(() =>
          apiRequest("/api/correctiveActions", {
            method: "POST",
            body: JSON.stringify(payload)
          })
        );
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err?.message || "Failed to save corrective action.");
    }
  };

  const remove = async (it) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Delete corrective action "${it.title}"?`)) return;
    setError(null);
    try {
      await apiRequest(`/api/corrective-actions/${it.id}`, { method: "DELETE" }).catch(() =>
        apiRequest(`/api/correctiveActions/${it.id}`, { method: "DELETE" })
      );
      await load();
    } catch (err) {
      setError(err?.message || "Failed to delete corrective action.");
    }
  };

  return (
    <div>
      <h1 className="mqms-page-title">Corrective Actions</h1>
      <p className="mqms-page-subtitle">Assign actions, track status, and surface overdue items.</p>

      {error ? <div className="mqms-alert mqms-alert--error">{error}</div> : null}

      <div className="mqms-toolbar">
        <div className="mqms-toolbar__left">
          <div className="mqms-field" style={{ minWidth: 260 }}>
            <label className="mqms-label">Search</label>
            <input className="mqms-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, owner, defect ID..." />
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800, color: "var(--text-muted)" }}>
            <input type="checkbox" checked={onlyOverdue} onChange={(e) => setOnlyOverdue(e.target.checked)} />
            Overdue only
          </label>
        </div>
        <div className="mqms-toolbar__right">
          <button
            className="mqms-btn"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            + New action
          </button>
        </div>
      </div>

      <div className="mqms-card">
        <div className="mqms-card__header">
          <div>
            <div className="mqms-card__title">{loading ? "Loading…" : `${filtered.length} action(s)`}</div>
            <div className="mqms-card__subtitle">
              Overdue actions are highlighted to support escalation.
            </div>
          </div>
        </div>
        <div className="mqms-card__body" style={{ paddingTop: 0 }}>
          <table className="mqms-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Owner</th>
                <th>Due</th>
                <th>Status</th>
                <th>Defect</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => {
                const overdue = isOverdue(it);
                return (
                  <tr key={it.id} style={overdue ? { background: "rgba(239, 68, 68, 0.06)" } : undefined}>
                    <td style={{ fontWeight: 900 }}>{it.title}</td>
                    <td>{it.owner}</td>
                    <td style={{ color: overdue ? "#991b1b" : "inherit", fontWeight: overdue ? 900 : 700 }}>
                      {it.dueDate ? String(it.dueDate).slice(0, 10) : "—"}
                    </td>
                    <td>{it.status}</td>
                    <td style={{ color: "var(--text-muted)" }}>{it.defectId || "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="mqms-btn mqms-btn--ghost"
                          onClick={() => {
                            setEditing(it);
                            setModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button className="mqms-btn mqms-btn--danger" onClick={() => remove(it)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: "var(--text-muted)" }}>
                    No actions found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen ? (
        <Modal title={editing ? "Edit corrective action" : "New corrective action"} onClose={() => setModalOpen(false)} size="md">
          <CAForm initial={editing} onSave={save} onCancel={() => setModalOpen(false)} />
        </Modal>
      ) : null}
    </div>
  );
}
