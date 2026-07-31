import { useState, useEffect, useCallback } from "react";
import api from "../api/client";
import RemarksModal from "../components/RemarksModal";
import { formatTime12Hour, formatDateDMY } from "../utils/formatters";
import "../styles/CompletedAppointmentsPage.css";

function CompletedAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCases, setExpandedCases] = useState({});
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const fetchCompletedAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/appointments/completed");
      setAppointments(data || []);
      
      // Auto-expand all cases by default for ease of use
      const initialExpanded = {};
      data.forEach((item) => {
        if (item.caseId) {
          initialExpanded[item.caseId] = true;
        }
      });
      setExpandedCases(initialExpanded);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch completed appointments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletedAppointments();
  }, [fetchCompletedAppointments]);

  const toggleCase = (caseId) => {
    setExpandedCases((prev) => ({
      ...prev,
      [caseId]: !prev[caseId],
    }));
  };

  // Group appointments by Case ID
  const grouped = appointments.reduce((acc, item) => {
    const caseId = item.caseId || "no-case";
    if (!acc[caseId]) {
      acc[caseId] = {
        caseId: item.caseId,
        caseNumber: item.caseNumber || "NO CASE",
        clientName: item.clientName || "—",
        appointments: [],
      };
    }
    acc[caseId].appointments.push(item);
    return acc;
  }, {});

  // Convert grouped to array and filter by search term
  const groupedArray = Object.values(grouped).filter((group) => {
    const term = searchTerm.toLowerCase();
    return (
      group.caseNumber.toLowerCase().includes(term) ||
      group.clientName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="completed-appts-container">
      <div className="completed-appts-header-section">
        <h1 className="completed-appts-title">Completed Appointments</h1>
        <p className="completed-appts-subtitle">
          View case-wise completed appointments and enter progress remarks
        </p>
      </div>

      <div className="completed-appts-filters">
        <div className="completed-appts-search-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="completed-appts-search-input"
            placeholder="Search by Case Number or Client Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="completed-appts-refresh-btn"
          onClick={fetchCompletedAppointments}
          aria-label="Refresh completed appointments"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"></path>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="completed-appts-state-container">
          <div className="completed-appts-spinner"></div>
          <p>Loading completed appointments...</p>
        </div>
      ) : error ? (
        <div className="completed-appts-state-container completed-appts-error-container">
          <p className="completed-appts-error-msg">{error}</p>
          <button type="button" className="master-btn btn-create" onClick={fetchCompletedAppointments}>
            Retry
          </button>
        </div>
      ) : groupedArray.length === 0 ? (
        <div className="completed-appts-state-container completed-appts-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <p>No completed appointments found.</p>
        </div>
      ) : (
        <div className="completed-appts-list">
          {groupedArray.map((group) => {
            const isExpanded = expandedCases[group.caseId] !== false;
            return (
              <div key={group.caseId} className="completed-case-card">
                <div
                  className="completed-case-header"
                  onClick={() => toggleCase(group.caseId)}
                  role="button"
                  aria-expanded={isExpanded}
                  tabIndex="0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      toggleCase(group.caseId);
                    }
                  }}
                >
                  <div className="completed-case-info">
                    <span className="completed-case-badge">Case ID: {group.caseId}</span>
                    <h2 className="completed-case-num">{group.caseNumber}</h2>
                    <span className="completed-case-client">Client: {group.clientName}</span>
                  </div>
                  <div className="completed-case-header-actions">
                    <span className="completed-appts-count">
                      {group.appointments.length} appointment{group.appointments.length > 1 ? "s" : ""}
                    </span>
                    <svg
                      className={`completed-case-chevron ${isExpanded ? "is-expanded" : ""}`}
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="completed-case-body">
                    <div className="completed-table-wrapper">
                      <table className="completed-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Client</th>
                            <th className="actions-column">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.appointments.map((appt) => (
                            <tr key={appt.id}>
                              <td className="appt-date">{formatDateDMY(appt.date)}</td>
                              <td className="appt-time">
                                {formatTime12Hour(appt.startTime)} - {formatTime12Hour(appt.endTime)}
                              </td>
                              <td className="appt-client">{appt.clientName || "—"}</td>
                              <td className="actions-column">
                                <button
                                  type="button"
                                  className="master-btn btn-update completed-remarks-btn"
                                  onClick={() => setSelectedAppointment(appt)}
                                >
                                  Remarks
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedAppointment && (
        <RemarksModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}

export default CompletedAppointmentsPage;
