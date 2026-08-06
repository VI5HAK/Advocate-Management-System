import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import { SubmitButton } from "./ActionButtons";

export function HearingNotesModal({ hearing, onClose }) {
  const { user } = useAuth();
  const isAdvocate = user?.role === "advocate";

  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/hearings/${hearing.id}/notes`);
      setNotes(data.remarks || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load progress notes.");
    } finally {
      setLoading(false);
    }
  }, [hearing.id]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSaving(true);
    setError("");
    try {
      await api.post(`/hearings/${hearing.id}/notes`, {
        remarkText: newNote,
      });
      setNewNote("");
      await fetchNotes();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add progress note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="remarks-modal-overlay">
      <div className="remarks-modal">
        <header className="remarks-modal-header">
          <h2>Progress Notes for Case: {hearing.caseNumber}</h2>
          <button type="button" className="remarks-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </header>

        <div className="remarks-modal-content">
          {error && <p className="master-error">{error}</p>}

          {!loading && isAdvocate && (
            <form onSubmit={handleSubmit} className="remarks-new-form">
              <label htmlFor="new-note-textarea">Add Progress Note</label>
              <textarea
                id="new-note-textarea"
                placeholder="Type hearing progress updates here..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                required
              />
              <div className="remarks-form-actions">
                <SubmitButton isEdit={false} saving={saving} label="Save Note" disabled={saving || !newNote.trim()} />
              </div>
            </form>
          )}

          <hr className="remarks-divider" />

          <h3>Hearing Progress History</h3>
          {loading ? (
            <p className="remarks-loading">Loading progress history...</p>
          ) : notes.length === 0 ? (
            <p className="remarks-empty">No progress notes entered for this hearing.</p>
          ) : (
            <div className="remarks-list">
              {notes.map((n) => (
                <div key={n.id} className="remark-item">
                  <div className="remark-item-meta">
                    <span className="remark-author">{n.createdBy}</span>
                    <span className="remark-date">
                      {n.remarkDate ? String(n.remarkDate).slice(0, 10) : "—"}
                    </span>
                  </div>
                  <p className="remark-text">{n.remarkText}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HearingNotesModal;
