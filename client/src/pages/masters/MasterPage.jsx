import { useCallback, useEffect, useState } from "react";
import api from "../../api/client";
import ConfirmDialog from "../../components/ConfirmDialog";
import { CreateButton, EditButton, DeleteButton, SubmitButton, CancelButton, HelpButton } from "../../components/ActionButtons";
import "../../styles/MasterPage.css";
import { uppercaseAlphaAndSpaces, descriptionValidation } from "../../utils/validation";
import { ShieldCheck, UserSquare2, Briefcase, Activity, Landmark, Gavel, MapPin, Database } from "lucide-react";

const ICON_MAP = {
  "roles": ShieldCheck,
  "client-types": UserSquare2,
  "case-types": Briefcase,
  "statuses": Activity,
  "courts": Landmark,
  "judges": Gavel,
  "locations": MapPin,
};


const RESOURCE_TO_PDF = {
  "roles": "Role_Help.pdf",
  "client-types": "ClientType_Help.pdf",
  "case-types": "CaseType_Help.pdf",
  "statuses": "Status_Help.pdf",
  "courts": "Court_Help.pdf",
};

function MasterPage({ config }) {
  const IconComponent = ICON_MAP[config.resource] || Database;
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
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
        <header className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {editingItem ? updateFormTitle : createFormTitle}
          </h1>
        </header>

        {error && (
          <div className="p-4 text-sm font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl" role="alert">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSave}>
          <div className="space-y-1.5">
            <label htmlFor={`${idPrefix}-name`} className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              {nameLabel}
            </label>
            <input
              id={`${idPrefix}-name`}
              type="text"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-50 focus:bg-white"
              value={form.name}
              onChange={(e) => {
                const target = e.target;
                const selectionStart = target ? target.selectionStart : null;
                const selectionEnd = target ? target.selectionEnd : null;
                const beforeLen = e.target.value ? e.target.value.length : 0;
                const val = uppercaseAlphaAndSpaces(e.target.value, 99);
                setForm((f) => ({ ...f, name: val }));

                if (target && typeof target.setSelectionRange === "function" && selectionStart !== null) {
                  const afterLen = val ? val.length : 0;
                  const lengthDiff = beforeLen - afterLen;
                  const adjustedStart = Math.max(0, selectionStart - lengthDiff);
                  const adjustedEnd = Math.max(0, selectionEnd - lengthDiff);
                  window.requestAnimationFrame(() => {
                    if (document.activeElement === target) {
                      target.setSelectionRange(adjustedStart, adjustedEnd);
                    }
                  });
                }
              }}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`${idPrefix}-description`} className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              {descriptionLabel}
            </label>
            <textarea
              id={`${idPrefix}-description`}
              rows={5}
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-50 focus:bg-white resize-vertical min-h-[120px]"
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <CancelButton onClick={backToList} disabled={saving} />
            <SubmitButton isEdit={!!editingItem} saving={saving} />
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <IconComponent className="h-8 w-8 shrink-0" />
          </div>
          {title}
          <HelpButton title={title} pdfName={pdfName} />
        </h1>
        <CreateButton onClick={openCreateForm} label={createButtonLabel} />
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
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-7 w-7 rounded-full text-slate-400 hover:text-slate-650 hover:bg-slate-100 transition-all cursor-pointer"
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
          <svg className="h-4 w-4" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </form>

      {error && (
        <div className="p-4 text-sm font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl" role="alert">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-250 bg-slate-50/75">
              <th className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]">{nameLabel}</th>
              <th className="hidden md:table-cell px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]">{descriptionLabel}</th>
              <th className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px] text-right w-[180px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-slate-400 font-medium">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-slate-400 font-medium">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-indigo-50/30 even:bg-slate-200/60 transition-colors">
                  <td className="px-5 py-4 text-slate-700 font-semibold align-middle">{item.name}</td>
                  <td className="hidden md:table-cell px-5 py-4 text-slate-650 font-semibold align-middle">{item.description || "—"}</td>
                  <td className="px-5 py-4 align-middle">
                    <div className="flex gap-2 justify-end">
                      <EditButton onClick={() => openEditForm(item)} />
                      <DeleteButton onClick={() => handleDelete(item)} />
                    </div>
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
