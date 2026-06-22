import { useCallback, useEffect, useState } from "react";
import api from "../../api/client";
import "../../styles/MasterPage.css";

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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    setError("");
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

  const handleDelete = async (item) => {
    if (!window.confirm(deleteConfirm(item.name))) return;

    setError("");
    try {
      await api.delete(`/masters/${resource}/${item.id}`);
      await fetchItems(activeSearch);
    } catch (err) {
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
                setForm((f) => ({ ...f, name: e.target.value }))
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
              value={form.description}
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
        <h1 className="master-title">{title}</h1>
        <button type="button" className="master-btn btn-create" onClick={openCreateForm}>
          {createButtonLabel}
        </button>
      </header>

      <form className="master-search" onSubmit={handleSearch}>
        <input
          type="text"
          className="master-search-input"
          placeholder={searchPlaceholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="master-btn">
          Search
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
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      className="master-btn master-btn-sm btn-delete"
                      onClick={() => handleDelete(item)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MasterPage;
