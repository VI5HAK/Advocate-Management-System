import { useCallback, useEffect, useState } from "react";
import api from "../../api/client";
import { CascadingLocationDropdown } from "../../components/CascadingLocationDropdown";
import { Landmark } from "lucide-react";
import SearchableSelect from "../../components/SearchableSelect";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  CreateButton,
  EditButton,
  DeleteButton,
  SubmitButton,
  CancelButton,
  HelpButton,
} from "../../components/ActionButtons";
import "../../styles/MasterPage.css";
import {
  uppercaseAlphaNumAndSpaces,
  descriptionValidation,
} from "../../utils/validation";



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
    State_ID: "",
    District_ID: "",
    Taluk_ID: "",
    courtType: "",
  });
  const [saving, setSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);



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
      State_ID: "",
      District_ID: "",
      Taluk_ID: "",
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
      State_ID: item.State_ID || "",
      District_ID: item.District_ID || "",
      Taluk_ID: item.Taluk_ID || "",
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
      State_ID: "",
      District_ID: "",
      Taluk_ID: "",
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
    if (!form.State_ID) {
      setError("Please select a State.");
      return;
    }
    if (!form.District_ID) {
      setError("Please select a District.");
      return;
    }
    if (!form.Taluk_ID) {
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
        State_ID: parseInt(form.State_ID, 10),
        District_ID: parseInt(form.District_ID, 10),
        Taluk_ID: parseInt(form.Taluk_ID, 10),
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
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
        <header className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {editingItem ? "Update Court" : "Create Court"}
          </h1>
        </header>

        {error && (
          <div className="p-4 text-sm font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl" role="alert">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSave}>
          <CascadingLocationDropdown
            State_ID={form.State_ID}
            District_ID={form.District_ID}
            Taluk_ID={form.Taluk_ID}
            onChange={(loc) => {
              setForm((f) => ({
                ...f,
                State_ID: loc.State_ID,
                District_ID: loc.District_ID,
                Taluk_ID: loc.Taluk_ID,
              }));
            }}
            rowClassName="space-y-1.5 [&>label]:block [&>label]:text-xs [&>label]:font-bold [&>label]:text-slate-500 [&>label]:uppercase [&>label]:tracking-wider"
            inputWrapperClassName=""
            selectClassName="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-50 focus:bg-white"
            required
          />

          <div className="space-y-1.5">
            <label htmlFor="court-type" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Court Type</label>
            <SearchableSelect
              id="court-type"
              value={form.courtType}
              options={[
                { value: "Supreme Court", label: "Supreme Court" },
                { value: "High Court", label: "High Court" },
                { value: "District Court", label: "District Court" },
                { value: "Family Court", label: "Family Court" },
                { value: "Municipal Court", label: "Municipal Court" },
                { value: "Sessions Court", label: "Sessions Court" },
              ]}
              onChange={(val) =>
                setForm((f) => ({ ...f, courtType: val }))
              }
              placeholder="Select Court Type"
              searchPlaceholder="Search court type..."
              emptyMessage="No court types found."
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="court-name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Court Name</label>
            <input
              id="court-name"
              type="text"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-50 focus:bg-white"
              value={form.name}
              onChange={(e) => {
                const target = e.target;
                const selectionStart = target ? target.selectionStart : null;
                const selectionEnd = target ? target.selectionEnd : null;
                const beforeLen = e.target.value ? e.target.value.length : 0;
                const val = uppercaseAlphaNumAndSpaces(e.target.value, 149);
                setForm((f) => ({
                  ...f,
                  name: val,
                }));

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
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="court-description" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Court Description</label>
            <textarea
              id="court-description"
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
      <header className="flex items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <Landmark className="h-6 w-6 sm:h-8 sm:w-8 shrink-0" />
          </div>
          <span className="truncate">Court Master</span>
          <HelpButton title="Court Master" pdfName="Court_Help.pdf" />
        </h1>
        <CreateButton onClick={openCreateForm} label="Create Court" />
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
            className="flex-1 w-full h-11 pl-11 pr-10 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-50 focus:bg-white"
            placeholder="Search by court name, description, district, or type"
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
              <th className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]">Court Name</th>
              <th className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]">Court Type</th>
              <th className="hidden md:table-cell px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]">Description</th>
              <th className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px] text-right w-[180px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-400 font-medium">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-400 font-medium">
                  No courts found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-indigo-50/30 even:bg-slate-200/60 transition-colors">
                  <td className="px-5 py-4 text-slate-700 font-semibold align-middle">{item.name}</td>
                  <td className="px-5 py-4 text-slate-650 font-semibold align-middle">{item.courtType || "—"}</td>
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
