import { useCallback, useEffect, useState } from "react";
import api from "../../api/client";
import { CascadingLocationDropdown } from "../../components/CascadingLocationDropdown";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  CreateButton,
  EditButton,
  DeleteButton,
  SubmitButton,
  CancelButton,
} from "../../components/ActionButtons";
import "../../styles/MasterPage.css";
import {
  uppercaseAlphaAndSpaces,
  descriptionValidation,
} from "../../utils/validation";

const helpPdfs = import.meta.glob("../../assets/*_Help.pdf", {
  eager: true,
  import: "default",
});

function CourtMaster() {
  const [view, setView] = useState("list");
  const [items, setItems] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    stateCode: "",
    districtCode: "",
    talukCode: "",
    courtType: "",
  });
  const [saving, setSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const pdfName = "Court_Help.pdf";
  const pdfUrl = helpPdfs[`../../assets/${pdfName}`];

  const handleHelpClick = () => {
    if (!pdfUrl) {
      alert('Help document for "Court Master" is not available yet.');
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
      stateCode: "",
      districtCode: "",
      talukCode: "",
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
      stateCode: item.stateCode || "",
      districtCode: item.districtCode || "",
      talukCode: item.talukCode || "",
      courtType: item.courtType || "",
    });
    setError("");
    setView("form");
  };

  const backToList = () => {
    setView("list");
    setEditingItem(null);
    setForm({
      name: "",
      description: "",
      stateCode: "",
      districtCode: "",
      talukCode: "",
      courtType: "",
    });
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
    if (!form.stateCode) {
      setError("Please select a State.");
      return;
    }
    if (!form.districtCode) {
      setError("Please select a District.");
      return;
    }
    if (!form.talukCode) {
      setError("Please select a Taluk.");
      return;
    }
    if (!form.courtType) {
      setError("Please select a Court Type.");
      return;
    }

    const descResult = descriptionValidation(
      "Court Description",
      100,
    ).safeParse(form.description ?? "");
    if (!descResult.success) {
      setError(descResult.error.issues[0].message);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        stateCode: parseInt(form.stateCode, 10),
        districtCode: parseInt(form.districtCode, 10),
        talukCode: parseInt(form.talukCode, 10),
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

  const handleDelete = (item) => {
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setError("");
    try {
      await api.delete(`/masters/courts/${itemToDelete.id}`);
      setItemToDelete(null);
      await fetchItems(activeSearch);
    } catch (err) {
      setItemToDelete(null);
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
          <CascadingLocationDropdown
            stateCode={form.stateCode}
            districtCode={form.districtCode}
            talukCode={form.talukCode}
            onChange={(loc) => {
              setForm((f) => ({
                ...f,
                stateCode: loc.stateCode,
                districtCode: loc.districtCode,
                talukCode: loc.talukCode,
              }));
            }}
            rowClassName="master-field"
            inputWrapperClassName=""
            required
          />

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
              <option value="" disabled>
                Select Court Type
              </option>
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
                setForm((f) => ({
                  ...f,
                  name: uppercaseAlphaAndSpaces(e.target.value, 149),
                }))
              }
              required
            />
          </div>

          <div className="master-field">
            <label htmlFor="court-description">Court Description</label>
            <textarea
              id="court-description"
              rows={6}
              maxLength={100}
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>

          <div className="master-form-actions">
            <CancelButton onClick={backToList} disabled={saving} />
            <SubmitButton isEdit={!!editingItem} saving={saving} />
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="master-page">
      <header className="master-header">
        <h1 className="master-title">
          Court Master
          <button
            type="button"
            className="master-help-btn"
            onClick={handleHelpClick}
            title="Court Master Help"
            aria-label="Court Master Help"
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
        <CreateButton onClick={openCreateForm} label="Create Court" />
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
                <td colSpan={7} className="master-empty">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="master-empty">
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
                    <EditButton onClick={() => openEditForm(item)} />
                    <DeleteButton onClick={() => handleDelete(item)} />
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
        message={
          itemToDelete ? `Do you want to delete "${itemToDelete.name}"?` : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}

export default CourtMaster;
