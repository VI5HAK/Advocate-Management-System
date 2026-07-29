import { useCallback, useEffect, useState } from "react";
import api from "../../api/client";
import ConfirmDialog from "../../components/ConfirmDialog";
import "../../styles/MasterPage.css";
import { uppercaseAlphaAndSpaces, descriptionValidation } from "../../utils/validation";

const helpPdfs = import.meta.glob("../../assets/*_Help.pdf", { eager: true, import: "default" });

const RESOURCE_TO_PDF = {
  "roles": "Role_Help.pdf",
  "client-types": "ClientType_Help.pdf",
  "case-types": "CaseType_Help.pdf",
  "statuses": "Status_Help.pdf",
  "courts": "Court_Help.pdf",
};

function MasterPage({ config }) {
  const {
    resource,
    idPrefix,
    title,
    createButtonLabel,
    createFormTitle,
    updateFormTitle,
    nameLabel,
    descriptionLabel,
    searchPlaceholder,
    emptyMessage,
    loadErrorMessage,
    saveErrorMessage,
    deleteErrorMessage,
    deleteConfirm,
  } = config;

  const [view, setView] = useState("list");
  const [items, setItems] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const pdfName = RESOURCE_TO_PDF[resource];
  const pdfUrl = pdfName ? helpPdfs[`../../assets/${pdfName}`] : null;

  const handleHelpClick = () => {
    if (!pdfUrl) {
      alert(`Help document for "${title}" is not available yet.`);
      return;
    }
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.setAttribute("download", pdfName);
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchItems = useCallback(
    async (search) => {
      setLoading(true);
      setError("");
      try {
        const params = search ? { search } : {};
        const { data } = await api.get(`/masters/${resource}`, { params });
        setItems(data);
      } catch {
        setError(loadErrorMessage);
      } finally {
        setLoading(false);
      }
    },
    [resource, loadErrorMessage],
  );

  useEffect(() => {
    if (view === "list") {
      fetchItems(activeSearch);
    }
  }, [activeSearch, fetchItems, view]);

  const openCreateForm = () => {
    setEditingItem(null);
    setForm({ name: "", description: "" });
    setError("");
    setView("form");
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || "",
      description: item.description || "",
    });
    setError("");
    setView("form");
  };

  const backToList = () => {
    setView("list");
    setEditingItem(null);
    setForm({ name: "", description: "" });
    setError("");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setError("");
    const descResult = descriptionValidation(descriptionLabel || "Description", 100).safeParse(form.description ?? "");
    if (!descResult.success) {
      setError(descResult.error.issues[0].message);
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/masters/${resource}/${editingItem.id}`, form);
      } else {
        await api.post(`/masters/${resource}`, form);
      }
      backToList();
    } catch (err) {
      setError(err.response?.data?.message || saveErrorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setError("");
    try {
      await api.delete(`/masters/${resource}/${itemToDelete.id}`);
      setItemToDelete(null);
      await fetchItems(activeSearch);
    } catch (err) {
      setItemToDelete(null);
      setError(err.response?.data?.message || deleteErrorMessage);
    }
  };

  if (view === "form") {
    return (
      <div className="master-page master-page-form">
        <header className="master-header">
          <h1 className="master-title">
            {editingItem ? updateFormTitle : createFormTitle}
          </h1>
        </header>

        {error && (
          <p className="master-error" role="alert">
            {error}
          </p>
        )}

        <form className="master-form" onSubmit={handleSave}>
          <div className="master-field">
            <label htmlFor={`${idPrefix}-name`}>{nameLabel}</label>
            <input
              id={`${idPrefix}-name`}
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: uppercaseAlphaAndSpaces(e.target.value, 99) }))
              }
              required
              autoFocus
            />
          </div>

          <div className="master-field">
            <label htmlFor={`${idPrefix}-description`}>
              {descriptionLabel}
            </label>
            <textarea
              id={`${idPrefix}-description`}
              rows={6}
              maxLength={100}
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>

          <div className="master-form-actions">
            <button
              type="button"
              className="master-btn master-btn-outline"
              onClick={backToList}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`master-btn ${editingItem ? "btn-update" : "btn-create"}`}
              disabled={saving}
            >
              {saving ? "Saving…" : editingItem ? "Update" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="master-page">
      <header className="master-header">
        <h1 className="master-title">
          {title}
          <button
            type="button"
            className="master-help-btn"
            onClick={handleHelpClick}
            title={`${title} Help`}
            aria-label={`${title} Help`}
          >
            <svg
              className="master-help-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
        </h1>
        <button type="button" className="master-btn btn-create" onClick={openCreateForm}>
          <span className="btn-text">{createButtonLabel}</span>
          <svg className="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
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

      <div className="master-table-wrap">
        <table className="master-table">
          <thead>
            <tr>
              <th>{nameLabel}</th>
              <th>{descriptionLabel}</th>
              <th className="master-actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="master-empty">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={3} className="master-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.description || "—"}</td>
                  <td className="master-actions">
                    <button
                      type="button"
                      className="master-btn master-btn-sm btn-update"
                      onClick={() => openEditForm(item)}
                      title="Update"
                    >
                      <span className="btn-text">Update</span>
                      <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="master-btn master-btn-sm btn-delete"
                      onClick={() => handleDelete(item)}
                      title="Delete"
                    >
                      <span className="btn-text">Delete</span>
                      <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        isOpen={!!itemToDelete}
        title="Confirm Delete"
        message={itemToDelete ? deleteConfirm(itemToDelete.name) : ""}
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}

export default MasterPage;
