import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import "../../styles/MasterPage.css";
import "../../styles/EntityListPage.css";

function formatCellValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
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

function EntityListPage({ config, readOnly = false }) {
  const {
    apiPath,
    title,
    createButtonLabel,
    searchPlaceholder,
    emptyMessage,
    loadErrorMessage,
    deleteErrorMessage,
    deleteConfirm,
    columns,
    createPath,
    updatePath,
  } = config;

  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdvocate = user?.role === "advocate";

  const displayedColumns = (isAdvocate && apiPath === "/appointments")
    ? columns.filter((col) => col.key !== "advocateName")
    : columns;

  const [items, setItems] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [selectedRemarksAppt, setSelectedRemarksAppt] = useState(null);

  const fetchItems = useCallback(
    async (search) => {
      setLoading(true);
      setError("");
      try {
        const params = search ? { search } : {};
        const { data } = await api.get(apiPath, { params });
        setItems(data);
      } catch {
        setError(loadErrorMessage);
      } finally {
        setLoading(false);
      }
    },
    [apiPath, loadErrorMessage],
  );

  useEffect(() => {
    fetchItems(activeSearch);
  }, [activeSearch, fetchItems]);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
  };

  const handleCreate = () => {
    if (createPath) {
      navigate(createPath);
      return;
    }
    setInfo("Create form will be implemented soon.");
    setTimeout(() => setInfo(""), 3000);
  };

  const handleUpdate = (row) => {
    if (updatePath) {
      navigate(updatePath(row.id));
      return;
    }
    setInfo("Update form will be implemented soon.");
    setTimeout(() => setInfo(""), 3000);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(deleteConfirm(row))) return;

    setError("");
    setInfo("");
    try {
      await api.delete(`${apiPath}/${row.id}`);
      await fetchItems(activeSearch);
    } catch (err) {
      setError(err.response?.data?.message || deleteErrorMessage);
    }
  };

  const handleOpenRemarks = (row) => {
    setSelectedRemarksAppt(row);
  };

  const hasActions = !readOnly || (isAdvocate && apiPath === "/appointments");

  return (
    <div className="master-page entity-list-page">
      <header className="master-header">
        <h1 className="master-title">{title}</h1>
        {!readOnly && (
          <button type="button" className="master-btn btn-create" onClick={handleCreate}>
            {createButtonLabel}
          </button>
        )}
      </header>

      <form className="master-search" onSubmit={handleSearch}>
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
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <button type="submit" className="master-btn">
          Search
        </button>
      </form>

      {error && (
        <p className="master-error" role="alert">
          {error}
        </p>
      )}

      {info && (
        <p className="entity-info" role="status">
          {info}
        </p>
      )}

      <div className="master-table-wrap entity-table-wrap">
        <table className="master-table entity-table">
          <thead>
            <tr>
              {displayedColumns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              {hasActions && <th className="master-actions-col">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={displayedColumns.length + (hasActions ? 1 : 0)} className="master-empty">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={displayedColumns.length + (hasActions ? 1 : 0)} className="master-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id}>
                  {displayedColumns.map((col) => {
                    let value = formatCellValue(row[col.key]);
                    if ((col.key === "startTime" || col.key === "endTime") && value !== "—") {
                      value = formatTime12Hour(value);
                    }
                    if (col.key === "clientName" && apiPath === "/cases") {
                      const clientNames = value.split(",").map(n => n.trim()).filter(Boolean);
                      if (clientNames.length > 1) {
                        return (
                          <td key={col.key}>
                            <div className="client-names-list">
                              {clientNames.map((name, idx) => (
                                <div key={idx} className="client-name-item">
                                  <span className="multiple-clients-dot" title="Multiple clients"></span>
                                  <span>{name}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      }
                    }
                    if (col.key === "advocateName" && apiPath === "/appointments") {
                      const advocateNames = value.split(",").map(n => n.trim()).filter(Boolean);
                      if (advocateNames.length > 1) {
                        return (
                          <td key={col.key}>
                            <div className="client-names-list">
                              {advocateNames.map((name, idx) => (
                                <div key={idx} className="client-name-item">
                                  <span className="multiple-clients-dot" title="Multiple advocates"></span>
                                  <span>{name}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      }
                    }
                    return <td key={col.key}>{value}</td>;
                  })}
                  {hasActions && (
                    <td className="master-actions">
                      {!readOnly ? (
                        <>
                          <button
                            type="button"
                            className="master-btn master-btn-sm btn-update"
                            onClick={() => handleUpdate(row)}
                          >
                            Update
                          </button>
                          <button
                            type="button"
                            className="master-btn master-btn-sm btn-delete"
                            onClick={() => handleDelete(row)}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="master-btn master-btn-sm btn-update"
                          onClick={() => handleOpenRemarks(row)}
                        >
                          Remarks
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedRemarksAppt && (
        <RemarksModal
          appointment={selectedRemarksAppt}
          onClose={() => setSelectedRemarksAppt(null)}
        />
      )}
    </div>
  );
}

function RemarksModal({ appointment, onClose }) {
  const [remarks, setRemarks] = useState([]);
  const [newRemark, setNewRemark] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  return (
    <div className="remarks-modal-overlay">
      <div className="remarks-modal">
        <header className="remarks-modal-header">
          <h2>Remarks for Case: {appointment.caseNumber}</h2>
          <button type="button" className="remarks-close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </header>

        <div className="remarks-modal-content">
          {error && <p className="master-error">{error}</p>}

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
              <button
                type="submit"
                className="master-btn btn-create"
                disabled={saving || !newRemark.trim()}
              >
                {saving ? "Saving..." : "Add Remark"}
              </button>
            </div>
          </form>

          <hr className="remarks-divider" />

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
                      {new Date(r.remarkDate).toLocaleString()} (Appt Date: {r.appointmentDate ? String(r.appointmentDate).slice(0, 10) : "—"})
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

export default EntityListPage;
