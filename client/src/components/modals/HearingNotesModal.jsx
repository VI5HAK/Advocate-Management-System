import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import entityService from "../../api/services/entity.service";
import { SubmitButton } from "../common/ActionButtons";
import DatePicker from "../ui/date-picker";
import dayjs from "../../utils/datePicker";
import { formatDateDMY } from "../../utils/formatters";

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
        const { data } = await entityService.getCase(hearing.caseId);
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
      const { data } = await entityService.getHearingNotes(hearing.id);
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
      await entityService.addHearingNote(hearing.id, {
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
      await entityService.addHearingNote(hearing.id, {
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

  return createPortal(
    <div className="remarks-modal-overlay">
      <div className="remarks-modal">
        <header className="remarks-modal-header">
          <h2>Progress Notes for Case: {hearing.caseNumber}</h2>
          <button type="button" className="remarks-close-btn" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 shrink-0" />
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
            <form onSubmit={handleNextHearingSubmit} className="next-hearing-inputs-form flex flex-col gap-4 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label htmlFor="next-hearing-date" className="text-sm font-semibold text-slate-700">
                    Next Hearing Date
                  </label>
                  <DatePicker
                    id="next-hearing-date"
                    value={nextHearingDate}
                    onChange={(val) => setNextHearingDate(val)}
                    min={dayjs().format("YYYY-MM-DD")}
                    required
                  />
                </div>
                <div className="flex-[2] flex flex-col gap-1.5">
                  <label htmlFor="next-hearing-purpose" className="text-sm font-semibold text-slate-700">
                    Next Hearing Purpose
                  </label>
                  <input
                    type="text"
                    id="next-hearing-purpose"
                    placeholder="Enter next hearing purpose..."
                    value={nextHearingPurpose}
                    onChange={(e) => setNextHearingPurpose(e.target.value)}
                    required
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:ring-4 focus:border-indigo-500 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end">
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
    </div>,
    document.body
  );
}

export default HearingNotesModal;
