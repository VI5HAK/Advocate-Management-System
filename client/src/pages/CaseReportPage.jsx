import { useState, useEffect } from "react";
import api from "../api/client";
import { CustomDatePicker } from "../components/CustomDatePicker";
import { formatTime12Hour, formatDateDMY } from "../utils/formatters";
import { Briefcase } from "lucide-react";
import "../styles/ReportsPage.css";

function getStatusBadgeStyle(status) {
  const base = {
    display: "inline-block",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
    fontWeight: "600",
    fontSize: "0.85rem",
    textAlign: "center",
  };
  if (status === "completed") {
    return { ...base, backgroundColor: "#d1fae5", color: "#047857" };
  }
  if (status === "deleted") {
    return { ...base, backgroundColor: "#fee2e2", color: "#b91c1c" };
  }
  return { ...base, backgroundColor: "#e0f2fe", color: "#0369a1" };
}

function CaseReportPage() {
  const [cases, setCases] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [caseId, setCaseId] = useState("all");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    async function fetchCases() {
      try {
        const { data } = await api.get("/cases");
        setCases(data);
      } catch (err) {
        console.error("Failed to load cases", err);
        setError("Failed to load cases.");
      }
    }
    fetchCases();
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
      const { data } = await api.get("/appointments/case-report", {
        params: { startDate, endDate, caseId },
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
    setCaseId("all");
    setAppointments([]);
    setError("");
    setSearched(false);
  };

  // Group appointments by caseNumber
  const grouped = appointments.reduce((acc, appt) => {
    const caseKey = appt.caseNumber || "NO CASE";
    if (!acc[caseKey]) {
      acc[caseKey] = [];
    }
    acc[caseKey].push(appt);
    return acc;
  }, {});

  return (
    <div className="reports-page">
      <h1 className="reports-title flex items-center justify-center gap-2">
        <Briefcase className="h-8 w-8 text-indigo-650 shrink-0" />
        Case Report
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
            <label htmlFor="case-select">Case Number</label>
            <select
              id="case-select"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
            >
              <option value="all">Select All</option>
              <option value="NO_CASE">NO CASE</option>
              {cases.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.caseNumber}
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
            Object.entries(grouped).map(([caseName, list]) => (
              <div key={caseName} className="report-group" style={{ marginBottom: "2rem" }}>
                <h3 style={{ margin: "1.5rem 0 0.75rem 0", color: "#111827", fontSize: "1.25rem", fontWeight: 600 }}>
                  Case Number: {caseName}
                </h3>
                <div className="reports-table-wrap">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Appointment Date</th>
                        <th>Time</th>
                        <th>Client Name</th>
                        <th className="col-desktop-only">Advocate Assigned</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((appoint) => (
                        <tr key={appoint.id} className="hover:bg-indigo-50/30 even:bg-slate-200/60 transition-colors">
                          <td>{formatDateDMY(appoint.date)}</td>
                          <td>
                            {appoint.startTime && appoint.endTime
                              ? `${formatTime12Hour(appoint.startTime)} - ${formatTime12Hour(appoint.endTime)}`
                              : (appoint.startTime ? formatTime12Hour(appoint.startTime) : "") || (appoint.endTime ? formatTime12Hour(appoint.endTime) : "") || "—"}
                          </td>
                          <td>{appoint.clientName || "—"}</td>
                          <td className="col-desktop-only">{appoint.advocateName || "—"}</td>
                          <td>
                            <span style={getStatusBadgeStyle(appoint.status)}>
                              {appoint.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default CaseReportPage;
