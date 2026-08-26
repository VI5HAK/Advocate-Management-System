import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../api/client";
import { SubmitButton } from "./ActionButtons";
import { formatDateDMY, formatRemarkDate } from "../utils/formatters";

export function RemarksModal({ appointment, onClose, readOnly = false }) {
  const [remarks, setRemarks] = useState([]);
  const [newRemark, setNewRemark] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [canAddRemark, setCanAddRemark] = useState(false);
  const [lockMessage, setLockMessage] = useState("");

  const fetchRemarks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/appointments/${appointment.id}/remarks`);
      setRemarks(data.remarks || []);
      setCanAddRemark(data.canAddRemark || false);
      setLockMessage(data.validationMessage || "");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load remarks.");
    } finally {
      setLoading(false);
    }
  }, [appointment.id]);

  useEffect(() => {
    fetchRemarks();
  }, [fetchRemarks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newRemark.trim()) return;

    setSaving(true);
    setError("");
    try {
      await api.post(`/appointments/${appointment.id}/remarks`, {
        remarkText: newRemark,
      });
      setNewRemark("");
      await fetchRemarks();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add remark.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="remarks-modal-overlay">
      <div className="remarks-modal">
        <header className="remarks-modal-header">
          <h2>Remarks for Case: {appointment.caseNumber}{appointment.clientName ? ` (Client: ${appointment.clientName})` : ""}</h2>
          <button type="button" className="remarks-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </header>

        <div className="remarks-modal-content">
          {error && <p className="master-error">{error}</p>}

          {!loading && !readOnly && (
            canAddRemark ? (
              <form onSubmit={handleSubmit} className="remarks-new-form">
                <label htmlFor="new-remark-textarea">Add New Remark</label>
                <textarea
                  id="new-remark-textarea"
                  placeholder="Type your progress remark here..."
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  required
                />
                <div className="remarks-form-actions">
                  <SubmitButton isEdit={false} saving={saving} label="Add Remark" disabled={saving || !newRemark.trim()} />
                </div>
              </form>
            ) : (
              lockMessage && (
                <div className="remarks-locked-message" style={{ padding: "1rem", background: "#f3f4f6", borderRadius: "8px", color: "#6b7280", textAlign: "center", marginBottom: "1.5rem" }}>
                  {lockMessage}
                </div>
              )
            )
          )}

          <hr className="remarks-divider" />

          <h3>Past Remarks History</h3>
          {loading ? (
            <p className="remarks-loading">Loading remarks history...</p>
          ) : remarks.length === 0 ? (
            <p className="remarks-empty">No remarks entered (Appt Date: {formatDateDMY(appointment.date)})</p>
          ) : (
            <div className="remarks-list">
              {remarks.map((r) => (
                <div key={r.id} className="remark-item">
                  <div className="remark-item-meta">
                    <span className="remark-author">{r.createdBy}</span>
                    <span className="remark-date">
                      {formatRemarkDate(r.remarkDate)} (Appt Date: {r.appointmentDate ? String(r.appointmentDate).slice(0, 10) : "—"})
                    </span>
                  </div>
                  <p className="remark-text">{r.remarkText}</p>
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

export default RemarksModal;
