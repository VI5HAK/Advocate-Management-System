import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  CreateButton,
  EditButton,
  DeleteButton,
} from "../../components/ActionButtons";
import RemarksModal from "../../components/RemarksModal";
import {
  formatCellValue,
  formatTime12Hour,
  formatDateDMY,
} from "../../utils/formatters";
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

  const displayedColumns =
    isAdvocate && apiPath === "/appointments"
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
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>
        {!readOnly && (
          <CreateButton onClick={handleCreate} label={createButtonLabel} />
        )}
      </header>

      <form className="flex gap-3" onSubmit={handleSearch}>
        <div className="relative flex-1 flex">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none"
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
            className="flex-1 w-full h-11 pl-11 pr-10 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-550/10 bg-slate-50 focus:bg-white"
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-7 w-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              onClick={handleClearSearch}
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-11 px-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] transition-all text-xs sm:text-sm font-semibold text-slate-750 inline-flex items-center gap-1.5 cursor-pointer bg-white"
        >
          <span className="hidden sm:inline">Search</span>
          <svg
            className="h-4 w-4"
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

      {error && (
        <div
          className="p-4 text-sm font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl"
          role="alert"
        >
          {error}
        </div>
      )}

      {info && (
        <div
          className="p-4 text-sm font-semibold text-indigo-650 bg-indigo-50/50 border border-indigo-100/50 rounded-xl"
          role="status"
        >
          {info}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-250 bg-slate-50/75">
              {displayedColumns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]"
                >
                  {col.label}
                </th>
              ))}
              {hasActions && (
                <th className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px] text-right w-[180px]">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={displayedColumns.length + (hasActions ? 1 : 0)}
                  className="px-5 py-8 text-center text-slate-400 font-medium"
                >
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={displayedColumns.length + (hasActions ? 1 : 0)}
                  className="px-5 py-8 text-center text-slate-400 font-medium"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/40 transition-colors"
                >
                  {displayedColumns.map((col) => {
                    const rawValue = row[col.key];
                    let cellContent;
                    if (col.render) {
                      cellContent = col.render(rawValue, row);
                    } else {
                      let value = formatCellValue(rawValue);
                      if (
                        (col.key === "startTime" || col.key === "endTime") &&
                        value !== "—"
                      ) {
                        value = formatTime12Hour(value);
                      }
                      if (col.key === "date" && value !== "—") {
                        value = formatDateDMY(value);
                      }
                      cellContent = value;
                    }
                    return (
                      <td
                        key={col.key}
                        className="px-5 py-4 text-slate-700 font-semibold align-middle"
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                  {hasActions && (
                    <td className="px-5 py-4 align-middle">
                      <div className="flex gap-2 justify-end">
                        {!readOnly ? (
                          <>
                            <EditButton onClick={() => handleUpdate(row)} />
                            <DeleteButton onClick={() => handleDelete(row)} />
                          </>
                        ) : apiPath === "/appointments" &&
                          row.caseNumber === "NO CASE" ? (
                          <span className="text-slate-400 font-medium px-3">
                            —
                          </span>
                        ) : (
                          <EditButton
                            onClick={() => handleOpenRemarks(row)}
                            label="Remarks"
                          >
                            <span className="hidden sm:inline">Remarks</span>
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          </EditButton>
                        )}
                      </div>
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
