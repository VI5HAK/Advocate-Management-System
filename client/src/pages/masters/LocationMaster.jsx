import { useCallback, useEffect, useState } from "react";
import api from "../../api/client";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  CreateButton,
  EditButton,
  DeleteButton,
  SubmitButton,
  CancelButton,
} from "../../components/ActionButtons";
import "../../styles/MasterPage.css";
import "../../styles/LocationMaster.css";
import { uppercaseAlphaAndSpaces } from "../../utils/validation";

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
      const { data } = await api.get("/locations/states");
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
      const { data } = await api.get("/locations/districts", {
        params: { State_ID },
      });
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
      const { data } = await api.get("/locations/taluks", {
        params: { District_ID },
      });
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
        const { data } = await api.get("/locations/districts", {
          params: { State_ID: form.State_ID },
        });
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
          await api.put(`/locations/states/${editingItem.code}`, {
            State_Name: name,
          });
        } else {
          await api.post("/locations/states", { State_Name: name });
        }
        await fetchStates();
      } else if (form.type === "district") {
        if (!form.State_ID) {
          setError("Please select a state.");
          setSaving(false);
          return;
        }
        if (editingItem) {
          await api.put(`/locations/districts/${editingItem.code}`, {
            State_ID: Number(form.State_ID),
            District_Name: name,
          });
        } else {
          await api.post("/locations/districts", {
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
          await api.put(`/locations/taluks/${editingItem.code}`, {
            District_ID: Number(form.District_ID),
            Taluk_Name: name,
          });
        } else {
          await api.post("/locations/taluks", {
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
        await api.delete(`/locations/states/${code}`);
        await fetchStates();
      } else if (type === "district") {
        await api.delete(`/locations/districts/${code}`);
        await fetchDistricts(parentStateCode);
      } else if (type === "taluk") {
        await api.delete(`/locations/taluks/${code}`);
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
      <div className="master-page master-page-form">
        <header className="master-header">
          <h1 className="master-title">
            {editingItem
              ? `Update ${form.type === "state" ? "State" : form.type === "district" ? "District" : "Taluk"}`
              : "Create New Location"}
          </h1>
        </header>

        {error && (
          <p className="master-error" role="alert">
            {error}
          </p>
        )}

        <form className="master-form" onSubmit={handleSave}>
          <div className="master-field">
            <label>Location Type</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="locationType"
                  value="state"
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
              <label className="radio-label">
                <input
                  type="radio"
                  name="locationType"
                  value="district"
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
              <label className="radio-label">
                <input
                  type="radio"
                  name="locationType"
                  value="taluk"
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
            <div className="master-field">
              <label htmlFor="form-state">State</label>
              <select
                id="form-state"
                value={form.State_ID}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    State_ID: e.target.value,
                    District_ID: "",
                  }))
                }
                required
              >
                <option value="" disabled>
                  Select State
                </option>
                {states.map((s) => (
                  <option key={s.State_ID} value={s.State_ID}>
                    {s.State_Name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.type === "taluk" && (
            <div className="master-field">
              <label htmlFor="form-district">District</label>
              <select
                id="form-district"
                value={form.District_ID}
                onChange={(e) =>
                  setForm((f) => ({ ...f, District_ID: e.target.value }))
                }
                required
                disabled={!form.State_ID || loadingFormDistricts}
              >
                <option value="" disabled>
                  {loadingFormDistricts
                    ? "Loading districts..."
                    : "Select District"}
                </option>
                {formDistricts.map((d) => (
                  <option key={d.District_ID} value={d.District_ID}>
                    {d.District_Name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="master-field">
            <label htmlFor="location-name">
              {form.type === "state"
                ? "State Name"
                : form.type === "district"
                  ? "District Name"
                  : "Taluk Name"}
            </label>
            <input
              id="location-name"
              type="text"
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
        <h1 className="master-title">Location Master</h1>
        <CreateButton onClick={openCreateForm} label="Create New" />
      </header>

      {error && (
        <p className="master-error" role="alert">
          {error}
        </p>
      )}

      <div className="location-tree">
        {loadingStates ? (
          <div className="master-empty">Loading Locations…</div>
        ) : states.length === 0 ? (
          <div className="master-empty">
            No states found. Please add a state.
          </div>
        ) : (
          states.map((state) => {
            const isStateExpanded = !!expandedStates[state.State_ID];
            const stateDistricts = districtsByState[state.State_ID] || [];
            const isStateLoading = !!loadingDistricts[state.State_ID];

            return (
              <div key={state.State_ID} className="tree-node">
                <div className="node-row state-row">
                  <div className="node-content">
                    <button
                      type="button"
                      className="expand-toggle"
                      onClick={() => toggleState(state.State_ID)}
                      aria-label={
                        isStateExpanded ? "Collapse state" : "Expand state"
                      }
                    >
                      {isStateExpanded ? (
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      )}
                    </button>
                    <span className="node-label">{state.State_Name}</span>
                  </div>
                  <div className="node-actions">
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
                  <div className="children-container">
                    {isStateLoading ? (
                      <div className="node-row district-row master-empty">
                        Loading districts...
                      </div>
                    ) : stateDistricts.length === 0 ? (
                      <div className="node-row district-row master-empty">
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
                            className="tree-node"
                          >
                            <div className="node-row district-row">
                              <div className="node-content">
                                <button
                                  type="button"
                                  className="expand-toggle"
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
                                      width="18"
                                      height="18"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                    >
                                      <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                  ) : (
                                    <svg
                                      viewBox="0 0 24 24"
                                      width="18"
                                      height="18"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                    >
                                      <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                  )}
                                </button>
                                <span className="node-label">
                                  {district.District_Name}
                                </span>
                              </div>
                              <div className="node-actions">
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
                              <div className="children-container">
                                {isDistrictLoading ? (
                                  <div className="node-row taluk-row master-empty">
                                    Loading taluks...
                                  </div>
                                ) : districtTaluks.length === 0 ? (
                                  <div className="node-row taluk-row master-empty">
                                    No taluks mapped.
                                  </div>
                                ) : (
                                  districtTaluks.map((taluk) => (
                                    <div
                                      key={taluk.Taluk_ID}
                                      className="node-row taluk-row"
                                    >
                                      <div className="node-content">
                                        <div className="expand-toggle-spacer" />
                                        <span className="node-label">
                                          {taluk.Taluk_Name}
                                        </span>
                                      </div>
                                      <div className="node-actions">
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
