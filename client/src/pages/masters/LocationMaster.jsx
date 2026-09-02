import { useCallback, useEffect, useState } from "react";
import masterService from "../../api/services/master.service";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import SearchableSelect from "../../components/common/SearchableSelect";
import {
  CreateButton,
  EditButton,
  DeleteButton,
  SubmitButton,
  CancelButton,
  HelpButton,
} from "../../components/common/ActionButtons";
import { uppercaseAlphaAndSpaces } from "../../utils/validation";
import { MapPin } from "lucide-react";

function LocationMaster() {
  const [view, setView] = useState("list");
  const [states, setStates] = useState([]);
  const [expandedStates, setExpandedStates] = useState({});
  const [districtsByState, setDistrictsByState] = useState({});
  const [expandedDistricts, setExpandedDistricts] = useState({});
  const [taluksByDistrict, setTaluksByDistrict] = useState({});
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState({});
  const [loadingTaluks, setLoadingTaluks] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState({
    type: "state", // state | district | taluk
    State_ID: "",
    District_ID: "",
    name: "",
  });

  const [formDistricts, setFormDistricts] = useState([]);
  const [loadingFormDistricts, setLoadingFormDistricts] = useState(false);

  // Fetch states
  const fetchStates = useCallback(async () => {
    setLoadingStates(true);
    setError("");
    try {
      const { data } = await masterService.getStates();
      setStates(data);
    } catch {
      setError("Failed to load states.");
    } finally {
      setLoadingStates(false);
    }
  }, []);

  const fetchDistricts = useCallback(async (State_ID) => {
    setLoadingDistricts((prev) => ({ ...prev, [State_ID]: true }));
    try {
      const { data } = await masterService.getDistricts(State_ID);
      setDistrictsByState((prev) => ({ ...prev, [State_ID]: data }));
    } catch (err) {
      console.error("Failed to load districts:", err);
    } finally {
      setLoadingDistricts((prev) => ({ ...prev, [State_ID]: false }));
    }
  }, []);

  const fetchTaluks = useCallback(async (District_ID) => {
    setLoadingTaluks((prev) => ({ ...prev, [District_ID]: true }));
    try {
      const { data } = await masterService.getTaluks(District_ID);
      setTaluksByDistrict((prev) => ({ ...prev, [District_ID]: data }));
    } catch (err) {
      console.error("Failed to load taluks:", err);
    } finally {
      setLoadingTaluks((prev) => ({ ...prev, [District_ID]: false }));
    }
  }, []);

  useEffect(() => {
    if (view === "list") {
      fetchStates();
    }
  }, [fetchStates, view]);

  // Handle cascading districts in form
  useEffect(() => {
    if (!form.State_ID) {
      setFormDistricts([]);
      return;
    }
    let active = true;
    async function getFormDistricts() {
      setLoadingFormDistricts(true);
      try {
        const { data } = await masterService.getDistricts(form.State_ID);
        if (active) setFormDistricts(data);
      } catch (err) {
        console.error("Failed to load form districts", err);
      } finally {
        if (active) setLoadingFormDistricts(false);
      }
    }
    getFormDistricts();
    return () => {
      active = false;
    };
  }, [form.State_ID]);

  const toggleState = async (State_ID) => {
    setExpandedStates((prev) => ({
      ...prev,
      [State_ID]: !prev[State_ID],
    }));

    if (!expandedStates[State_ID] && !districtsByState[State_ID]) {
      await fetchDistricts(State_ID);
    }
  };

  const toggleDistrict = async (District_ID) => {
    setExpandedDistricts((prev) => ({
      ...prev,
      [District_ID]: !prev[District_ID],
    }));

    if (!expandedDistricts[District_ID] && !taluksByDistrict[District_ID]) {
      await fetchTaluks(District_ID);
    }
  };

  const openCreateForm = () => {
    setEditingItem(null);
    setForm({
      type: "state",
      State_ID: "",
      District_ID: "",
      name: "",
    });
    setError("");
    setView("form");
  };

  const handleEditState = (state) => {
    setEditingItem({
      type: "state",
      code: state.State_ID,
      name: state.State_Name,
    });
    setForm({
      type: "state",
      State_ID: "",
      District_ID: "",
      name: state.State_Name,
    });
    setError("");
    setView("form");
  };

  const handleEditDistrict = (district) => {
    setEditingItem({
      type: "district",
      code: district.District_ID,
      name: district.District_Name,
      parentStateCode: district.State_ID,
    });
    setForm({
      type: "district",
      State_ID: district.State_ID,
      District_ID: "",
      name: district.District_Name,
    });
    setError("");
    setView("form");
  };

  const handleEditTaluk = (taluk, State_ID, District_ID) => {
    setEditingItem({
      type: "taluk",
      code: taluk.Taluk_ID,
      name: taluk.Taluk_Name,
      parentStateCode: State_ID,
      parentDistrictCode: District_ID,
    });
    setForm({
      type: "taluk",
      State_ID: State_ID,
      District_ID: District_ID,
      name: taluk.Taluk_Name,
    });
    setError("");
    setView("form");
  };

  const backToList = () => {
    setView("list");
    setEditingItem(null);
    setForm({
      type: "state",
      State_ID: "",
      District_ID: "",
      name: "",
    });
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    setError("");

    try {
      const name = form.name.trim();

      if (form.type === "state") {
        if (editingItem) {
          await masterService.updateState(editingItem.code, {
            State_Name: name,
          });
        } else {
          await masterService.createState({ State_Name: name });
        }
        await fetchStates();
      } else if (form.type === "district") {
        if (!form.State_ID) {
          setError("Please select a state.");
          setSaving(false);
          return;
        }
        if (editingItem) {
          await masterService.updateDistrict(editingItem.code, {
            State_ID: Number(form.State_ID),
            District_Name: name,
          });
        } else {
          await masterService.createDistrict({
            State_ID: Number(form.State_ID),
            District_Name: name,
          });
        }
        if (
          editingItem &&
          Number(editingItem.parentStateCode) !== Number(form.State_ID)
        ) {
          await fetchDistricts(editingItem.parentStateCode);
        }
        await fetchDistricts(form.State_ID);
      } else if (form.type === "taluk") {
        if (!form.District_ID) {
          setError("Please select a district.");
          setSaving(false);
          return;
        }
        if (editingItem) {
          await masterService.updateTaluk(editingItem.code, {
            District_ID: Number(form.District_ID),
            Taluk_Name: name,
          });
        } else {
          await masterService.createTaluk({
            District_ID: Number(form.District_ID),
            Taluk_Name: name,
          });
        }
        if (
          editingItem &&
          Number(editingItem.parentDistrictCode) !== Number(form.District_ID)
        ) {
          await fetchTaluks(editingItem.parentDistrictCode);
        }
        await fetchTaluks(form.District_ID);
      }

      backToList();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save location.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (
    type,
    code,
    name,
    parentStateCode,
    parentDistrictCode,
  ) => {
    setItemToDelete({ type, code, name, parentStateCode, parentDistrictCode });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setError("");
    try {
      const { type, code, parentStateCode, parentDistrictCode } = itemToDelete;
      if (type === "state") {
        await masterService.deleteState(code);
        await fetchStates();
      } else if (type === "district") {
        await masterService.deleteDistrict(code);
        await fetchDistricts(parentStateCode);
      } else if (type === "taluk") {
        await masterService.deleteTaluk(code);
        await fetchTaluks(parentDistrictCode);
      }
      setItemToDelete(null);
    } catch (err) {
      setItemToDelete(null);
      setError(err.response?.data?.message || "Failed to delete location.");
    }
  };

  if (view === "form") {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
        <header className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            {editingItem
              ? `Update ${form.type === "state" ? "State" : form.type === "district" ? "District" : "Taluk"}`
              : "Create New Location"}
          </h1>
        </header>

        {error && (
          <div className="p-4 text-sm font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl" role="alert">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSave}>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Location Type</label>
            <div className="flex flex-wrap gap-5 pt-1">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="locationType"
                  value="state"
                  className="h-4 w-4 text-indigo-655 border-slate-300 focus:ring-indigo-500 focus:ring-offset-0 transition-all"
                  checked={form.type === "state"}
                  onChange={() =>
                    setForm((f) => ({
                      ...f,
                      type: "state",
                      State_ID: "",
                      District_ID: "",
                    }))
                  }
                  disabled={!!editingItem}
                />
                State
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="locationType"
                  value="district"
                  className="h-4 w-4 text-indigo-650 border-slate-300 focus:ring-indigo-500 focus:ring-offset-0 transition-all"
                  checked={form.type === "district"}
                  onChange={() =>
                    setForm((f) => ({
                      ...f,
                      type: "district",
                      State_ID: "",
                      District_ID: "",
                    }))
                  }
                  disabled={!!editingItem}
                />
                District
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="locationType"
                  value="taluk"
                  className="h-4 w-4 text-indigo-650 border-slate-300 focus:ring-indigo-500 focus:ring-offset-0 transition-all"
                  checked={form.type === "taluk"}
                  onChange={() =>
                    setForm((f) => ({
                      ...f,
                      type: "taluk",
                      State_ID: "",
                      District_ID: "",
                    }))
                  }
                  disabled={!!editingItem}
                />
                Taluk
              </label>
            </div>
          </div>

          {(form.type === "district" || form.type === "taluk") && (
            <div className="space-y-1.5">
              <label htmlFor="form-state" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">State</label>
              <SearchableSelect
                id="form-state"
                value={form.State_ID}
                options={states.map((s) => ({ value: s.State_ID, label: s.State_Name }))}
                onChange={(val) =>
                  setForm((f) => ({
                    ...f,
                    State_ID: val,
                    District_ID: "",
                  }))
                }
                placeholder="Select State"
                searchPlaceholder="Search state..."
                emptyMessage="No states found."
              />
            </div>
          )}

          {form.type === "taluk" && (
            <div className="space-y-1.5">
              <label htmlFor="form-district" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">District</label>
              <SearchableSelect
                id="form-district"
                value={form.District_ID}
                options={formDistricts.map((d) => ({ value: d.District_ID, label: d.District_Name }))}
                onChange={(val) =>
                  setForm((f) => ({ ...f, District_ID: val }))
                }
                placeholder={
                  !form.State_ID
                    ? "Select a state first"
                    : loadingFormDistricts
                    ? "Loading districts..."
                    : "Select District"
                }
                searchPlaceholder="Search district..."
                emptyMessage="No districts found."
                disabled={!form.State_ID || loadingFormDistricts}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="location-name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              {form.type === "state"
                ? "State Name"
                : form.type === "district"
                  ? "District Name"
                  : "Taluk Name"}
            </label>
            <input
              id="location-name"
              type="text"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-50 focus:bg-white"
              value={form.name}
              onChange={(e) => {
                const target = e.target;
                const selectionStart = target ? target.selectionStart : null;
                const selectionEnd = target ? target.selectionEnd : null;
                const beforeLen = e.target.value ? e.target.value.length : 0;
                const val = uppercaseAlphaAndSpaces(e.target.value, 99);
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
              autoFocus
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
            <MapPin className="h-6 w-6 sm:h-8 sm:w-8 shrink-0" />
          </div>
          <span className="truncate">Location Master</span>
          <HelpButton title="Location Master" />
        </h1>
        <CreateButton onClick={openCreateForm} label="Create New" />
      </header>

      {error && (
        <div className="p-4 text-sm font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl" role="alert">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
        {loadingStates ? (
          <div className="px-5 py-8 text-center text-slate-400 font-medium">Loading Locations…</div>
        ) : states.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 font-medium">
            No states found. Please add a state.
          </div>
        ) : (
          states.map((state) => {
            const isStateExpanded = !!expandedStates[state.State_ID];
            const stateDistricts = districtsByState[state.State_ID] || [];
            const isStateLoading = !!loadingDistricts[state.State_ID];

            return (
              <div key={state.State_ID} className="flex flex-col divide-y divide-slate-100">
                <div className="flex items-center justify-between px-5 py-4 bg-slate-50/75 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      type="button"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-750 hover:bg-slate-150 active:scale-95 transition-all inline-flex items-center justify-center cursor-pointer h-7 w-7 bg-white/50"
                      onClick={() => toggleState(state.State_ID)}
                      aria-label={
                        isStateExpanded ? "Collapse state" : "Expand state"
                      }
                    >
                      {isStateExpanded ? (
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      )}
                    </button>
                    <span className="text-slate-800 font-bold text-base">{state.State_Name}</span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <EditButton onClick={() => handleEditState(state)} />
                    <DeleteButton
                      onClick={() =>
                        handleDeleteClick(
                          "state",
                          state.State_ID,
                          state.State_Name,
                        )
                      }
                    />
                  </div>
                </div>

                {isStateExpanded && (
                  <div className="flex flex-col divide-y divide-slate-100 bg-slate-50/10">
                    {isStateLoading ? (
                      <div className="pl-12 px-5 py-4 text-slate-400 font-medium">
                        Loading districts...
                      </div>
                    ) : stateDistricts.length === 0 ? (
                      <div className="pl-12 px-5 py-4 text-slate-400 font-medium">
                        No districts mapped.
                      </div>
                    ) : (
                      stateDistricts.map((district) => {
                        const isDistrictExpanded =
                          !!expandedDistricts[district.District_ID];
                        const districtTaluks =
                          taluksByDistrict[district.District_ID] || [];
                        const isDistrictLoading =
                          !!loadingTaluks[district.District_ID];

                        return (
                          <div
                            key={district.District_ID}
                            className="flex flex-col divide-y divide-slate-100"
                          >
                            <div className="flex items-center justify-between pl-12 pr-5 py-3.5 hover:bg-slate-50/40 transition-colors">
                              <div className="flex items-center gap-3 flex-1">
                                <button
                                  type="button"
                                  className="p-1 rounded-lg text-slate-400 hover:text-slate-750 hover:bg-slate-150 active:scale-95 transition-all inline-flex items-center justify-center cursor-pointer h-7 w-7 bg-white/50"
                                  onClick={() =>
                                    toggleDistrict(district.District_ID)
                                  }
                                  aria-label={
                                    isDistrictExpanded
                                      ? "Collapse district"
                                      : "Expand district"
                                  }
                                >
                                  {isDistrictExpanded ? (
                                    <svg
                                      viewBox="0 0 24 24"
                                      width="16"
                                      height="16"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                    >
                                      <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                  ) : (
                                    <svg
                                      viewBox="0 0 24 24"
                                      width="16"
                                      height="16"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                    >
                                      <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                  )}
                                </button>
                                <span className="text-slate-700 font-semibold text-sm">
                                  {district.District_Name}
                                </span>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <EditButton
                                  onClick={() => handleEditDistrict(district)}
                                />
                                <DeleteButton
                                  onClick={() =>
                                    handleDeleteClick(
                                      "district",
                                      district.District_ID,
                                      district.District_Name,
                                      state.State_ID,
                                    )
                                  }
                                />
                              </div>
                            </div>

                            {isDistrictExpanded && (
                              <div className="flex flex-col divide-y divide-slate-100 bg-slate-50/20">
                                {isDistrictLoading ? (
                                  <div className="pl-20 px-5 py-3 text-slate-400 font-medium">
                                    Loading taluks...
                                  </div>
                                ) : districtTaluks.length === 0 ? (
                                  <div className="pl-20 px-5 py-3 text-slate-400 font-medium">
                                    No taluks mapped.
                                  </div>
                                ) : (
                                  districtTaluks.map((taluk) => (
                                    <div
                                      key={taluk.Taluk_ID}
                                      className="flex items-center justify-between pl-20 pr-5 py-3 hover:bg-slate-50/60 transition-colors"
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        <div className="w-7 h-7" />
                                        <span className="text-slate-600 font-medium text-sm">
                                          {taluk.Taluk_Name}
                                        </span>
                                      </div>
                                      <div className="flex gap-2 justify-end">
                                        <EditButton
                                          onClick={() =>
                                            handleEditTaluk(
                                              taluk,
                                              state.State_ID,
                                              district.District_ID,
                                            )
                                          }
                                        />
                                        <DeleteButton
                                          onClick={() =>
                                            handleDeleteClick(
                                              "taluk",
                                              taluk.Taluk_ID,
                                              taluk.Taluk_Name,
                                              state.State_ID,
                                              district.District_ID,
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={!!itemToDelete}
        title="Confirm Delete"
        message={
          itemToDelete
            ? `Are you sure you want to delete the ${itemToDelete.type} "${itemToDelete.name}"?`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}

export default LocationMaster;
