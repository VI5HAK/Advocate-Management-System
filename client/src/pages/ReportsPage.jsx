import { useState, useEffect, useRef } from "react";
import api from "../api/client";
import "../styles/ReportsPage.css";

function CustomDatePicker({ id, value, onChange, required }) {
  const dateInputRef = useRef(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (value) {
      const display = value.split("-").reverse().join("/");
      setInputValue(display);
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleClick = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch (err) {
        dateInputRef.current.focus();
      }
    }
  };

  const handleInputChange = (e) => {
    let val = e.target.value;
    
    // Automatically insert slashes as user types
    if (val.length > inputValue.length) {
      if (val.length === 2 || val.length === 5) {
        val += "/";
      }
    }
    
    if (val.length <= 10) {
      setInputValue(val);
    }

    const dmyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = val.match(dmyPattern);
    if (match) {
      const dd = match[1];
      const mm = match[2];
      const yyyy = match[3];
      const isoDate = `${yyyy}-${mm}-${dd}`;
      const d = new Date(isoDate);
      if (!isNaN(d.getTime())) {
        onChange(isoDate);
      }
    } else if (val === "") {
      onChange("");
    }
  };

  const handleBlur = () => {
    const dmyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (inputValue && !inputValue.match(dmyPattern)) {
      if (value) {
        setInputValue(value.split("-").reverse().join("/"));
      } else {
        setInputValue("");
      }
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
      <input
        type="text"
        className="reports-input-text"
        value={inputValue}
        placeholder="DD/MM/YYYY"
        onChange={handleInputChange}
        onBlur={handleBlur}
        style={{ width: "100%", height: "3.25rem", minHeight: "3.25rem", padding: "0 2.5rem 0 1rem", border: "1px solid #9ca3af", borderRadius: "6px", boxSizing: "border-box", background: "#fff", fontSize: "1.05rem", fontFamily: "inherit", color: "#111827" }}
      />
      <button
        type="button"
        onClick={handleClick}
        style={{
          position: "absolute",
          right: "0.75rem",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "1.1rem",
          display: "flex",
          alignItems: "center",
          color: "#6b7280"
        }}
      >
        📅
      </button>
      <input
        id={id}
        ref={dateInputRef}
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: "none"
        }}
      />
    </div>
  );
}

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
      <h1 className="reports-title">Appointment Report</h1>

      <form className="reports-form" onSubmit={handleSubmit}>
        {error && <div className="reports-error">{error}</div>}

        <div className="form-grid">
          <div className="form-row">
            <label htmlFor="start-date">Start Date</label>
            <CustomDatePicker
              id="start-date"
              value={startDate}
              onChange={setStartDate}
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="end-date">End Date</label>
            <CustomDatePicker
              id="end-date"
              value={endDate}
              onChange={setEndDate}
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
                    <tr key={appoint.id}>
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
