import { useState, useEffect } from "react";
import api from "../api/client";
import { CustomDatePicker } from "../components/CustomDatePicker";
import RemarksModal from "../components/RemarksModal";
import { formatTime12Hour, formatDateDMY } from "../utils/formatters";
import { Users } from "lucide-react";
import "../styles/ReportsPage.css";
import "../styles/EntityListPage.css";

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
      <h1 className="reports-title flex items-center justify-center gap-2">
        <Users className="h-8 w-8 text-indigo-650 shrink-0" />
        Client Report
      </h1>

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
                    <tr key={appoint.id} className="hover:bg-indigo-50/30 even:bg-slate-200/60 transition-colors">
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
                        {appoint.caseNumber === "NO CASE" ? (
                          "—"
                        ) : (
                          <button
                            type="button"
                            className="master-btn master-btn-sm btn-update"
                            onClick={() => setSelectedRemarksAppt(appoint)}
                          >
                            Remarks
                          </button>
                        )}
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
        <RemarksModal
          appointment={selectedRemarksAppt}
          onClose={() => setSelectedRemarksAppt(null)}
          readOnly={true}
        />
      )}
    </div>
  );
}

export default ClientReportPage;
