import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import { CreateButton, EditButton, DeleteButton } from "../../components/ActionButtons";
import RemarksModal from "../../components/RemarksModal";
import { formatCellValue, formatTime12Hour, formatDateDMY } from "../../utils/formatters";
import "../../styles/MasterPage.css";
import "../../styles/EntityListPage.css";

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
                    const rawValue = row[col.key];
                    if (col.render) {
                      return <td key={col.key}>{col.render(rawValue, row)}</td>;
                    }
                    let value = formatCellValue(rawValue);
                    if ((col.key === "startTime" || col.key === "endTime") && value !== "—") {
                      value = formatTime12Hour(value);
                    }
                    if (col.key === "date" && value !== "—") {
                      value = formatDateDMY(value);
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

export default EntityListPage;
