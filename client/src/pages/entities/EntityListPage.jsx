import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import { CreateButton, EditButton, DeleteButton, SubmitButton } from "../../components/ActionButtons";
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
  const [rowToDelete, setRowToDelete] = useState(null);

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

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
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

  const handleDelete = (row) => {
    setRowToDelete(row);
  };

  const confirmDelete = async () => {
    if (!rowToDelete) return;
    setError("");
    setInfo("");
    try {
      await api.delete(`${apiPath}/${rowToDelete.id}`);
      setRowToDelete(null);
      await fetchItems(activeSearch);
    } catch (err) {
      setRowToDelete(null);
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
          <CreateButton onClick={handleCreate} label={createButtonLabel} />
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
          {searchInput && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={handleClearSearch}
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" className="master-btn">
          <span className="btn-text">Search</span>
          <svg className="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
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
                    if (col.key === "date" && value !== "—" && value.includes("-")) {
                      const parts = value.split("-");
                      if (parts.length === 3) {
                        value = `${parts[2]}/${parts[1]}/${parts[0]}`;
                      }
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
                          <EditButton onClick={() => handleUpdate(row)} />
                          <DeleteButton onClick={() => handleDelete(row)} />
                        </>
                      ) : (
                        apiPath === "/appointments" && row.caseNumber === "NO CASE" ? (
                          "—"
                        ) : (
                          <EditButton onClick={() => handleOpenRemarks(row)} label="Remarks">
                            <span className="btn-text">Remarks</span>
                            <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          </EditButton>
                        )
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

      <ConfirmDialog
        isOpen={!!rowToDelete}
        title="Confirm Delete"
        message={rowToDelete ? deleteConfirm(rowToDelete) : ""}
        onConfirm={confirmDelete}
        onCancel={() => setRowToDelete(null)}
      />
    </div>
  );
}

export function RemarksModal({ appointment, onClose }) {
  const [remarks, setRemarks] = useState([]);
  const [newRemark, setNewRemark] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [canAddRemark, setCanAddRemark] = useState(false);
  const [lockMessage, setLockMessage] = useState("");

  const formatApptDate = (dateStr) => {
    if (!dateStr || !dateStr.includes("-")) return dateStr || "—";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

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

          {!loading && (
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
            <p className="remarks-empty">No remarks entered (Appt Date: {formatApptDate(appointment.date)})</p>
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

export default EntityListPage;
