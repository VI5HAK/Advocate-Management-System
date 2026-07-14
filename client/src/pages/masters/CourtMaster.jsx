import { useCallback, useEffect, useState } from "react";
import api from "../../api/client";
import "../../styles/MasterPage.css";

function CourtMaster() {
  const [view, setView] = useState("list");
  const [items, setItems] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    districtId: "",
    courtType: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async (search) => {
    setLoading(true);
    setError("");
    try {
      const params = search ? { search } : {};
      const { data } = await api.get("/masters/courts", { params });
      setItems(data);
    } catch {
      setError("Failed to load courts.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDistricts = useCallback(async () => {
    try {
      const { data } = await api.get("/masters/districts");
      setDistricts(data);
    } catch (err) {
      console.error("Failed to load districts", err);
    }
  }, []);

  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts]);

  useEffect(() => {
    if (view === "list") {
      fetchItems(activeSearch);
    }
  }, [activeSearch, fetchItems, view]);

  const openCreateForm = () => {
    setEditingItem(null);
    setForm({
      name: "",
      description: "",
      districtId: "",
      courtType: "",
    });
    setError("");
    setView("form");
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || "",
      description: item.description || "",
      districtId: item.districtId || "",
      courtType: item.courtType || "",
    });
    setError("");
    setView("form");
  };

  const backToList = () => {
    setView("list");
    setEditingItem(null);
    setForm({ name: "", description: "", districtId: "", courtType: "" });
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
    if (!form.districtId) {
      setError("Please select a District.");
      return;
    }
    if (!form.courtType) {
      setError("Please select a Court Type.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        districtId: parseInt(form.districtId, 10),
        courtType: form.courtType,
      };

      if (editingItem) {
        await api.put(`/masters/courts/${editingItem.id}`, payload);
      } else {
        await api.post("/masters/courts", payload);
      }
      backToList();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save court.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete court "${item.name}"?`)) return;

    setError("");
    try {
      await api.delete(`/masters/courts/${item.id}`);
      await fetchItems(activeSearch);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete court.");
    }
  };

  if (view === "form") {
    return (
      <div className="master-page master-page-form">
        <header className="master-header">
          <h1 className="master-title">
            {editingItem ? "Update Court" : "Create Court"}
          </h1>
        </header>

        {error && (
          <p className="master-error" role="alert">
            {error}
          </p>
        )}

        <form className="master-form" onSubmit={handleSave}>
          <div className="master-field">
            <label htmlFor="court-district">District</label>
            <select
              id="court-district"
              value={form.districtId}
              onChange={(e) =>
                setForm((f) => ({ ...f, districtId: e.target.value }))
              }
              required
            >
              <option value="" disabled>Select District</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="master-field">
            <label htmlFor="court-type">Court Type</label>
            <select
              id="court-type"
              value={form.courtType}
              onChange={(e) =>
                setForm((f) => ({ ...f, courtType: e.target.value }))
              }
              required
            >
              <option value="" disabled>Select Court Type</option>
              <option value="Supreme Court">Supreme Court</option>
              <option value="High Court">High Court</option>
              <option value="District Court">District Court</option>
              <option value="Family Court">Family Court</option>
              <option value="Municipal Court">Municipal Court</option>
              <option value="Sessions Court">Sessions Court</option>
            </select>
          </div>

          <div className="master-field">
            <label htmlFor="court-name">Court Name</label>
            <input
              id="court-name"
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="master-field">
            <label htmlFor="court-description">Court Description</label>
            <textarea
              id="court-description"
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
        <h1 className="master-title">Court Master</h1>
        <button
          type="button"
          className="master-btn btn-create"
          onClick={openCreateForm}
        >
          <span className="btn-text">Create Court</span>
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
            placeholder="Search by court name, description, district, or type"
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
              <th>Court Name</th>
              <th>Court Type</th>
              <th>District</th>
              <th>Description</th>
              <th className="master-actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="master-empty">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="master-empty">
                  No courts found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.courtType || "—"}</td>
                  <td>{item.districtName || "—"}</td>
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
    </div>
  );
}

export default CourtMaster;
