import { useEffect, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import { formatDateDMY } from "../../utils/formatters";
import "../../styles/MasterPage.css";
import "../../styles/EntityListPage.css";

function HearingList() {
  const { user } = useAuth();
  const isAdvocate = user?.role === "advocate";

  const [hearings, setHearings] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for collapsible case details
  const [expandedHearingId, setExpandedHearingId] = useState(null);
  const [caseDetailsDict, setCaseDetailsDict] = useState({});
  const [caseLoadingDict, setCaseLoadingDict] = useState({});

  const fetchHearings = async (searchTerm = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(
        `/hearings?search=${encodeURIComponent(searchTerm)}`,
      );
      setHearings(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load hearings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHearings();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHearings(search);
  };

  const toggleExpand = async (hearingId, caseId) => {
    if (expandedHearingId === hearingId) {
      setExpandedHearingId(null);
    } else {
      setExpandedHearingId(hearingId);
      if (!caseDetailsDict[caseId] && !caseLoadingDict[caseId]) {
        setCaseLoadingDict((prev) => ({ ...prev, [caseId]: true }));
        try {
          const res = await api.get(`/cases/${caseId}`);
          setCaseDetailsDict((prev) => ({ ...prev, [caseId]: res.data }));
        } catch (err) {
          console.error("Failed to load case details:", err);
        } finally {
          setCaseLoadingDict((prev) => ({ ...prev, [caseId]: false }));
        }
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hearing?"))
      return;
    try {
      await api.delete(`/hearings/${id}`);
      fetchHearings(search);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete hearing.");
    }
  };

  return (
    <div className="master-page entity-list-page">
      <style>{`
        .case-expand-btn {
          background: none;
          border: none;
          color: #2563eb;
          cursor: pointer;
          font-size: 1rem;
          padding: 0 0.5rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }
        .case-expand-btn:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }
        .expand-chevron {
          display: inline-block;
          transition: transform 0.2s ease;
          font-size: 0.75rem;
        }
        .expand-chevron.expanded {
          transform: rotate(90deg);
        }
        .subform-row-container {
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .case-detail-subform-wrapper {
          padding: 1.5rem 2rem;
        }
        .case-detail-subform-wrapper h4 {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          color: #334155;
          border-bottom: 1.5px solid #cbd5e1;
          padding-bottom: 0.35rem;
        }
        .case-subform-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1rem;
        }
        .subform-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .subform-field label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        .subform-field input {
          padding: 0.5rem 0.75rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background-color: #f1f5f9;
          color: #334155;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: not-allowed;
        }
        .subform-loading-spinner {
          color: #64748b;
          font-size: 0.95rem;
          font-style: italic;
          padding: 1rem;
        }
      `}</style>

      <header className="master-header">
        <h1 className="master-title">Hearing List</h1>
        {!isAdvocate && (
          <Link to="/hearings/create" className="master-btn btn-create">
            <span className="btn-text">+ Create Hearing</span>
            <svg
              className="btn-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Link>
        )}
      </header>

      <form className="master-search" onSubmit={handleSearchSubmit}>
        <div className="master-search-input-wrap">
          <svg
            className="search-icon-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="master-search-input"
            placeholder="Search by client, case, court, judge..."
            value={search}
            onChange={handleSearchChange}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setSearch("");
                fetchHearings("");
              }}
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" className="master-btn">
          <span className="btn-text">Search</span>
          <svg
            className="btn-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </form>

      {error && <p className="master-error">{error}</p>}

      {loading ? (
        <p className="master-empty">Loading hearings...</p>
      ) : hearings.length === 0 ? (
        <p className="master-empty">No hearings scheduled.</p>
      ) : (
        <div className="master-table-wrap entity-table-wrap">
          <table className="master-table entity-table">
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Hearing Date</th>
                <th>Hearing Time</th>
                <th>Advocate Name</th>
                {!isAdvocate && <th className="master-actions-col">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {hearings.map((h) => {
                const isExpanded = expandedHearingId === h.id;
                const caseDetails = caseDetailsDict[h.caseId];
                const caseLoading = caseLoadingDict[h.caseId];

                return (
                  <Fragment key={h.id}>
                    <tr style={{ borderBottom: isExpanded ? "none" : "" }}>
                      <td>
                        <button
                          type="button"
                          className="case-expand-btn"
                          onClick={() => toggleExpand(h.id, h.caseId)}
                        >
                          <span
                            className={`expand-chevron ${isExpanded ? "expanded" : ""}`}
                          >
                            ▶
                          </span>
                          {h.caseNumber}
                        </button>
                      </td>
                      <td>{formatDateDMY(h.date)}</td>
                      <td>
                        {h.time}
                      </td>
                      <td>{h.advocateName || "—"}</td>
                      {!isAdvocate && (
                        <td className="master-actions">
                          <Link
                            to={`/hearings/${h.id}/edit`}
                            className="master-btn master-btn-sm btn-update"
                            title="Update"
                          >
                            <span className="btn-text">Update</span>
                            <svg
                              className="btn-icon"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleDelete(h.id)}
                            className="master-btn master-btn-sm btn-delete"
                            title="Delete"
                          >
                            <span className="btn-text">Delete</span>
                            <svg
                              className="btn-icon"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                    {isExpanded && (
                      <tr className="subform-row-container">
                        <td colSpan={isAdvocate ? 4 : 5}>
                          <div className="case-detail-subform-wrapper">
                            <h4>Case Master Details ({h.caseNumber})</h4>
                            {caseLoading ? (
                              <p className="subform-loading-spinner">
                                Loading case details...
                              </p>
                            ) : caseDetails ? (
                              <div className="case-subform-grid">
                                <div className="subform-field">
                                  <label>Case Type</label>
                                  <input
                                    type="text"
                                    value={caseDetails.caseTypeName || "—"}
                                    readOnly
                                    disabled
                                  />
                                </div>
                                <div className="subform-field">
                                  <label>Court Name</label>
                                  <input
                                    type="text"
                                    value={caseDetails.courtName || "—"}
                                    readOnly
                                    disabled
                                  />
                                </div>
                                <div className="subform-field">
                                  <label>Petitioner</label>
                                  <input
                                    type="text"
                                    value={caseDetails.petitioner || "—"}
                                    readOnly
                                    disabled
                                  />
                                </div>
                                <div className="subform-field">
                                  <label>Pet Advocate</label>
                                  <input
                                    type="text"
                                    value={
                                      caseDetails.petitionerAdvocate || "—"
                                    }
                                    readOnly
                                    disabled
                                  />
                                </div>
                                <div className="subform-field">
                                  <label>Respondent</label>
                                  <input
                                    type="text"
                                    value={caseDetails.respondent || "—"}
                                    readOnly
                                    disabled
                                  />
                                </div>
                                <div className="subform-field">
                                  <label>Res Advocate</label>
                                  <input
                                    type="text"
                                    value={
                                      caseDetails.respondentAdvocate || "—"
                                    }
                                    readOnly
                                    disabled
                                  />
                                </div>
                                <div className="subform-field">
                                  <label>Filing Number</label>
                                  <input
                                    type="text"
                                    value={caseDetails.filingNum || "—"}
                                    readOnly
                                    disabled
                                  />
                                </div>
                                <div className="subform-field">
                                  <label>Filing Date</label>
                                  <input
                                    type="text"
                                    value={formatDateDMY(
                                      caseDetails.filingDate,
                                    )}
                                    readOnly
                                    disabled
                                  />
                                </div>
                                <div className="subform-field">
                                  <label>Registration Number</label>
                                  <input
                                    type="text"
                                    value={caseDetails.regNum || "—"}
                                    readOnly
                                    disabled
                                  />
                                </div>
                                <div className="subform-field">
                                  <label>Registration Date</label>
                                  <input
                                    type="text"
                                    value={formatDateDMY(
                                      caseDetails.regDate,
                                    )}
                                    readOnly
                                    disabled
                                  />
                                </div>
                                <div className="subform-field">
                                  <label>E-Filing Number</label>
                                  <input
                                    type="text"
                                    value={caseDetails.efilingNum || "—"}
                                    readOnly
                                    disabled
                                  />
                                </div>
                                <div className="subform-field">
                                  <label>E-Filing Date</label>
                                  <input
                                    type="text"
                                    value={formatDateDMY(
                                      caseDetails.efilingDate,
                                    )}
                                    readOnly
                                    disabled
                                  />
                                </div>
                                <div className="subform-field">
                                  <label>CNR Number</label>
                                  <input
                                    type="text"
                                    value={caseDetails.cnrNum || "—"}
                                    readOnly
                                    disabled
                                  />
                                </div>
                                <div className="subform-field" style={{ gridColumn: "1 / -1" }}>
                                  <label>Purpose of Hearing</label>
                                  <input
                                    type="text"
                                    value={h.purposeText || "—"}
                                    readOnly
                                    disabled
                                  />
                                </div>
                              </div>
                            ) : (
                              <p
                                className="subform-loading-spinner"
                                style={{ color: "#ef4444" }}
                              >
                                Failed to load case details.
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HearingList;
