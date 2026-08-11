import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import { SubmitButton } from "./ActionButtons";
import { formatDateDMY } from "../utils/formatters";

export function HearingNotesModal({ hearing, onClose }) {
  const { user } = useAuth();
  const isAdvocate = user?.role === "advocate";

  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [caseDetails, setCaseDetails] = useState(null);
  const [caseLoading, setCaseLoading] = useState(false);
  const [nextHearingDate, setNextHearingDate] = useState("");
  const [nextHearingPurpose, setNextHearingPurpose] = useState("");

  const existingNoteWithNextHearing = notes.find(n => n.nextHearingDate || n.nextHearingPurpose);
  const hasNextHearing = !!existingNoteWithNextHearing;
  const existingNextHearingDate = existingNoteWithNextHearing?.nextHearingDate;
  const existingNextHearingPurpose = existingNoteWithNextHearing?.nextHearingPurpose;

  useEffect(() => {
    let active = true;
    const fetchCaseDetails = async () => {
      setCaseLoading(true);
      try {
        const { data } = await api.get(`/cases/${hearing.caseId}`);
        if (active) {
          setCaseDetails(data);
        }
      } catch (err) {
        console.error("Failed to load case details:", err);
      } finally {
        if (active) {
          setCaseLoading(false);
        }
      }
    };
    if (hearing.caseId) {
      fetchCaseDetails();
    }
    return () => {
      active = false;
    };
  }, [hearing.caseId]);

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

  const handleNextHearingSubmit = async (e) => {
    e.preventDefault();
    if (!nextHearingDate || !nextHearingPurpose.trim()) return;

    setSaving(true);
    setError("");
    try {
      await api.post(`/hearings/${hearing.id}/notes`, {
        nextHearingDate,
        nextHearingPurpose: nextHearingPurpose.trim(),
      });
      setNextHearingDate("");
      setNextHearingPurpose("");
      await fetchNotes();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save next hearing details.");
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
          {caseLoading ? (
            <div className="hearing-case-details-summary">
              Loading case details summary...
            </div>
          ) : (
            <div className="hearing-case-details-summary">
              <div className="court-line">
                <strong>{hearing.courtName || caseDetails?.courtName || "—"}</strong>, {caseDetails?.districtName || "—"}
              </div>
              <div>
                In the court of <strong>{hearing.judgeName || "—"}</strong>
              </div>
              <div>
                CNR Number <strong>{caseDetails?.cnrNum || "—"}</strong>
              </div>
              <div className="vs-line">
                {caseDetails?.petitioner || "—"} vs {caseDetails?.respondent || "—"}
              </div>
              {hasNextHearing && (
                <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px dashed #cbd5e1", fontSize: "0.9rem" }}>
                  {existingNextHearingDate && (
                    <div>
                      Next Hearing Date: <strong>{formatDateDMY(existingNextHearingDate)}</strong>
                    </div>
                  )}
                  {existingNextHearingPurpose && (
                    <div>
                      Next Hearing Purpose: <strong>{existingNextHearingPurpose}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && <p className="master-error">{error}</p>}

          {!loading && isAdvocate && !hasNextHearing && (
            <form onSubmit={handleNextHearingSubmit} className="next-hearing-inputs-form" style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginBottom: "1.5rem",
              padding: "1rem",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px"
            }}>
              <div style={{ display: "flex", gap: "1.5rem" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <label htmlFor="next-hearing-date" style={{ fontSize: "0.95rem", fontWeight: "600", color: "#475569" }}>
                    Next Hearing Date
                  </label>
                  <input
                    type="date"
                    id="next-hearing-date"
                    value={nextHearingDate}
                    onChange={(e) => setNextHearingDate(e.target.value)}
                    required
                    style={{
                      padding: "0.65rem 0.85rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "0.95rem",
                      color: "#334155",
                      backgroundColor: "#ffffff"
                    }}
                  />
                </div>
                <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <label htmlFor="next-hearing-purpose" style={{ fontSize: "0.95rem", fontWeight: "600", color: "#475569" }}>
                    Next Hearing Purpose
                  </label>
                  <input
                    type="text"
                    id="next-hearing-purpose"
                    placeholder="Enter next hearing purpose..."
                    value={nextHearingPurpose}
                    onChange={(e) => setNextHearingPurpose(e.target.value)}
                    required
                    style={{
                      padding: "0.65rem 0.85rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "0.95rem",
                      color: "#334155",
                      backgroundColor: "#ffffff"
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <SubmitButton
                  isEdit={false}
                  saving={saving}
                  label="Save Next Hearing Details"
                  disabled={saving || !nextHearingDate || !nextHearingPurpose.trim()}
                />
              </div>
            </form>
          )}

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
                      {n.remarkDate ? formatDateDMY(n.remarkDate) : "—"}
                    </span>
                  </div>
                  <p className="remark-text">{n.remarkText}</p>
                  {(n.nextHearingDate || n.nextHearingPurpose) && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#64748b", borderTop: "1px dashed #cbd5e1", paddingTop: "0.5rem" }}>
                      {n.nextHearingDate && (
                        <div>Next Hearing Date: <strong>{formatDateDMY(n.nextHearingDate)}</strong></div>
                      )}
                      {n.nextHearingPurpose && (
                        <div>Next Hearing Purpose: <strong>{n.nextHearingPurpose}</strong></div>
                      )}
                    </div>
                  )}
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
