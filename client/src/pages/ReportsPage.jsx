import { useState, useEffect } from "react";
import api from "../api/client";
import { CustomDatePicker } from "../components/CustomDatePicker";
import { formatTime12Hour, formatDateDMY } from "../utils/formatters";
import { CalendarRange } from "lucide-react";
import "../styles/ReportsPage.css";

function ReportsPage() {
  const [advocates, setAdvocates] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [advocateId, setAdvocateId] = useState("all");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    async function fetchAdvocates() {
      try {
        const { data } = await api.get("/advocates");
        setAdvocates(data);
      } catch (err) {
        console.error("Failed to load advocates", err);
        setError("Failed to load advocates.");
      }
    }
    fetchAdvocates();
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
      const { data } = await api.get("/appointments/report", {
        params: { startDate, endDate, advocateId },
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
    setAdvocateId("all");
    setAppointments([]);
    setError("");
    setSearched(false);
  };

  return (
    <div className="reports-page">
      <h1 className="reports-title flex items-center justify-center gap-2">
        <CalendarRange className="h-8 w-8 text-indigo-650 shrink-0" />
        Appointment Report
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
            <label htmlFor="advocate">Advocate</label>
            <select
              id="advocate"
              value={advocateId}
              onChange={(e) => setAdvocateId(e.target.value)}
            >
              <option value="all">Select All</option>
              {advocates.map((adv) => (
                <option key={adv.id} value={adv.id}>
                  {adv.advocateName}
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
                    <th>Advocate Name</th>
                    <th>Case Number</th>
                    <th>Appointment Date</th>
                    <th className="col-desktop-only">Client Name</th>
                    <th className="col-desktop-only">Start Time</th>
                    <th className="col-desktop-only">End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appoint) => (
                    <tr key={appoint.id} className="hover:bg-indigo-50/30 even:bg-slate-200/60 transition-colors">
                      <td>{appoint.advocateName || "—"}</td>
                      <td>{appoint.caseNumber}</td>
                      <td>{formatDateDMY(appoint.date)}</td>
                      <td className="col-desktop-only">{appoint.clientName}</td>
                      <td className="col-desktop-only">{appoint.startTime ? formatTime12Hour(appoint.startTime) : "—"}</td>
                      <td className="col-desktop-only">{appoint.endTime ? formatTime12Hour(appoint.endTime) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
