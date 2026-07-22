import { useState, useEffect, useCallback } from "react";
import api from "../api/client";
import { CustomDatePicker } from "../components/CustomDatePicker";
import "../styles/ReportsPage.css";
import "../styles/EntityListPage.css";

function formatTime12Hour(timeString) {
  if (!timeString || timeString === "—") return "—";
  const parts = timeString.split(":");
  if (parts.length < 2) return timeString;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeString;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const paddedHours = String(hours).padStart(2, "0");
  return `${paddedHours}:${minutes} ${ampm}`;
}

function formatDateDMY(dateString) {
  if (!dateString || dateString === "—") return "—";
  if (dateString.includes("-")) {
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateString;
}

function formatRemarkDate(dateValue) {
  if (!dateValue) return "—";
  const dateStr = String(dateValue).trim();
  const isoStr = dateStr.includes(" ") && !dateStr.includes("T")
    ? dateStr.replace(" ", "T")
    : dateStr;
  const d = new Date(isoStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleString();
  }
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (match) {
    const [_, year, month, day, hour, minute, second] = match;
    const localDate = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      parseInt(hour, 10),
      parseInt(minute, 10),
      parseInt(second, 10)
    );
    if (!isNaN(localDate.getTime())) {
      return localDate.toLocaleString();
    }
  }
  return dateStr;
}

function ClientReportPage() {
  const [clients, setClients] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [clientId, setClientId] = useState("all");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedRemarksAppt, setSelectedRemarksAppt] = useState(null);

  useEffect(() => {
    async function fetchClients() {
      try {
        const { data } = await api.get("/clients");
        setClients(data);
      } catch (err) {
        console.error("Failed to load clients", err);
        setError("Failed to load clients.");
      }
    }
    fetchClients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError("Start date and End date are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await api.get("/appointments/client-report", {
        params: { startDate, endDate, clientId },
      });
      setAppointments(data);
      setSearched(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setClientId("all");
    setAppointments([]);
    setError("");
    setSearched(false);
    setSelectedRemarksAppt(null);
  };

  return (
    <div className="reports-page">
      <h1 className="reports-title">Client Report</h1>

      <form className="reports-form" onSubmit={handleSubmit}>
        {error && <div className="reports-error">{error}</div>}

        <div className="form-grid">
          <div className="form-row">
            <label htmlFor="start-date">Start Date</label>
            <CustomDatePicker
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="end-date">End Date</label>
            <CustomDatePicker
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="client">Client Name</label>
            <select
              id="client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="all">Select All</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.clientName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="reports-form-actions">
          <button type="submit" className="reports-submit-btn" disabled={loading}>
            {loading ? "Loading..." : "Submit"}
          </button>
          <button
            type="button"
            className="reports-reset-btn"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>

      {loading && <div className="reports-loading">Loading report data...</div>}

      {!loading && searched && (
        <div className="reports-results">
          {appointments.length === 0 ? (
            <div className="reports-empty">No appointments found for the selected criteria.</div>
          ) : (
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Client Name</th>
                    <th>Case Number</th>
                    <th>Appointment Date</th>
                    <th className="col-desktop-only">Time</th>
                    <th className="col-desktop-only">Advocate Assigned</th>
                    <th className="col-desktop-only">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appoint) => (
                    <tr key={appoint.id}>
                      <td>{appoint.clientName || "—"}</td>
                      <td>{appoint.caseNumber}</td>
                      <td>{formatDateDMY(appoint.date)}</td>
                      <td className="col-desktop-only">
                        {appoint.startTime && appoint.endTime
                          ? `${formatTime12Hour(appoint.startTime)} - ${formatTime12Hour(appoint.endTime)}`
                          : (appoint.startTime ? formatTime12Hour(appoint.startTime) : "") || (appoint.endTime ? formatTime12Hour(appoint.endTime) : "") || "—"}
                      </td>
                      <td className="col-desktop-only">{appoint.advocateName || "—"}</td>
                      <td className="col-desktop-only">
                        <button
                          type="button"
                          className="master-btn master-btn-sm btn-update"
                          onClick={() => setSelectedRemarksAppt(appoint)}
                        >
                          Remarks
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedRemarksAppt && (
        <ReadOnlyRemarksModal
          appointment={selectedRemarksAppt}
          onClose={() => setSelectedRemarksAppt(null)}
        />
      )}
    </div>
  );
}

function ReadOnlyRemarksModal({ appointment, onClose }) {
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRemarks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/appointments/${appointment.id}/remarks`);
      setRemarks(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load remarks.");
    } finally {
      setLoading(false);
    }
  }, [appointment.id]);

  useEffect(() => {
    fetchRemarks();
  }, [fetchRemarks]);

  return (
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

          <h3>Past Remarks History</h3>
          {loading ? (
            <p className="remarks-loading">Loading remarks history...</p>
          ) : remarks.length === 0 ? (
            <p className="remarks-empty">No remarks found for this case yet.</p>
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
    </div>
  );
}

export default ClientReportPage;
