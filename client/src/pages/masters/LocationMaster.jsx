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
    stateCode: "",
    districtCode: "",
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

  const fetchDistricts = useCallback(async (stateCode) => {
    setLoadingDistricts((prev) => ({ ...prev, [stateCode]: true }));
    try {
      const { data } = await api.get("/locations/districts", {
        params: { stateCode },
      });
      setDistrictsByState((prev) => ({ ...prev, [stateCode]: data }));
    } catch (err) {
      console.error("Failed to load districts:", err);
    } finally {
      setLoadingDistricts((prev) => ({ ...prev, [stateCode]: false }));
    }
  }, []);

  const fetchTaluks = useCallback(async (districtCode) => {
    setLoadingTaluks((prev) => ({ ...prev, [districtCode]: true }));
    try {
      const { data } = await api.get("/locations/taluks", {
        params: { districtCode },
      });
      setTaluksByDistrict((prev) => ({ ...prev, [districtCode]: data }));
    } catch (err) {
      console.error("Failed to load taluks:", err);
    } finally {
      setLoadingTaluks((prev) => ({ ...prev, [districtCode]: false }));
    }
  }, []);

  useEffect(() => {
    if (view === "list") {
      fetchStates();
    }
  }, [fetchStates, view]);

  // Handle cascading districts in form
  useEffect(() => {
    if (!form.stateCode) {
      setFormDistricts([]);
      return;
    }
    let active = true;
    async function getFormDistricts() {
      setLoadingFormDistricts(true);
      try {
        const { data } = await api.get("/locations/districts", {
          params: { stateCode: form.stateCode },
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
  }, [form.stateCode]);

  const toggleState = async (stateCode) => {
    setExpandedStates((prev) => ({
      ...prev,
      [stateCode]: !prev[stateCode],
    }));

    if (!expandedStates[stateCode] && !districtsByState[stateCode]) {
      await fetchDistricts(stateCode);
    }
  };

  const toggleDistrict = async (districtCode) => {
    setExpandedDistricts((prev) => ({
      ...prev,
      [districtCode]: !prev[districtCode],
    }));

    if (!expandedDistricts[districtCode] && !taluksByDistrict[districtCode]) {
      await fetchTaluks(districtCode);
    }
  };

  const openCreateForm = () => {
    setEditingItem(null);
    setForm({
      type: "state",
      stateCode: "",
      districtCode: "",
      name: "",
    });
    setError("");
    setView("form");
  };

  const handleEditState = (state) => {
    setEditingItem({
      type: "state",
      code: state.stateCode,
      name: state.stateName,
    });
    setForm({
      type: "state",
      stateCode: "",
      districtCode: "",
      name: state.stateName,
    });
    setError("");
    setView("form");
  };

  const handleEditDistrict = (district) => {
    setEditingItem({
      type: "district",
      code: district.districtCode,
      name: district.districtName,
      parentStateCode: district.stateCode,
    });
    setForm({
      type: "district",
      stateCode: district.stateCode,
      districtCode: "",
      name: district.districtName,
    });
    setError("");
    setView("form");
  };

  const handleEditTaluk = (taluk, stateCode, districtCode) => {
    setEditingItem({
      type: "taluk",
      code: taluk.talukCode,
      name: taluk.talukName,
      parentStateCode: stateCode,
      parentDistrictCode: districtCode,
    });
    setForm({
      type: "taluk",
      stateCode: stateCode,
      districtCode: districtCode,
      name: taluk.talukName,
    });
    setError("");
    setView("form");
  };

  const backToList = () => {
    setView("list");
    setEditingItem(null);
    setForm({
      type: "state",
      stateCode: "",
      districtCode: "",
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
            stateName: name,
          });
        } else {
          await api.post("/locations/states", { stateName: name });
        }
        await fetchStates();
      } else if (form.type === "district") {
        if (!form.stateCode) {
          setError("Please select a state.");
          setSaving(false);
          return;
        }
        if (editingItem) {
          await api.put(`/locations/districts/${editingItem.code}`, {
            stateCode: Number(form.stateCode),
            districtName: name,
          });
        } else {
          await api.post("/locations/districts", {
            stateCode: Number(form.stateCode),
            districtName: name,
          });
        }
        if (
          editingItem &&
          Number(editingItem.parentStateCode) !== Number(form.stateCode)
        ) {
          await fetchDistricts(editingItem.parentStateCode);
        }
        await fetchDistricts(form.stateCode);
      } else if (form.type === "taluk") {
        if (!form.districtCode) {
          setError("Please select a district.");
          setSaving(false);
          return;
        }
        if (editingItem) {
          await api.put(`/locations/taluks/${editingItem.code}`, {
            districtCode: Number(form.districtCode),
            talukName: name,
          });
        } else {
          await api.post("/locations/taluks", {
            districtCode: Number(form.districtCode),
            talukName: name,
          });
        }
        if (
          editingItem &&
          Number(editingItem.parentDistrictCode) !== Number(form.districtCode)
        ) {
          await fetchTaluks(editingItem.parentDistrictCode);
        }
        await fetchTaluks(form.districtCode);
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
                      stateCode: "",
                      districtCode: "",
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
                      stateCode: "",
                      districtCode: "",
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
                      stateCode: "",
                      districtCode: "",
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
                value={form.stateCode}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    stateCode: e.target.value,
                    districtCode: "",
                  }))
                }
                required
              >
                <option value="" disabled>
                  Select State
                </option>
                {states.map((s) => (
                  <option key={s.stateCode} value={s.stateCode}>
                    {s.stateName}
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
                value={form.districtCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, districtCode: e.target.value }))
                }
                required
                disabled={!form.stateCode || loadingFormDistricts}
              >
                <option value="" disabled>
                  {loadingFormDistricts
                    ? "Loading districts..."
                    : "Select District"}
                </option>
                {formDistricts.map((d) => (
                  <option key={d.districtCode} value={d.districtCode}>
                    {d.districtName}
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
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: uppercaseAlphaAndSpaces(e.target.value, 99),
                }))
              }
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
            const isStateExpanded = !!expandedStates[state.stateCode];
            const stateDistricts = districtsByState[state.stateCode] || [];
            const isStateLoading = !!loadingDistricts[state.stateCode];

            return (
              <div key={state.stateCode} className="tree-node">
                <div className="node-row state-row">
                  <div className="node-content">
                    <button
                      type="button"
                      className="expand-toggle"
                      onClick={() => toggleState(state.stateCode)}
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
                    <span className="node-label">{state.stateName}</span>
                  </div>
                  <div className="node-actions">
                    <EditButton onClick={() => handleEditState(state)} />
                    <DeleteButton
                      onClick={() =>
                        handleDeleteClick(
                          "state",
                          state.stateCode,
                          state.stateName,
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
                          !!expandedDistricts[district.districtCode];
                        const districtTaluks =
                          taluksByDistrict[district.districtCode] || [];
                        const isDistrictLoading =
                          !!loadingTaluks[district.districtCode];

                        return (
                          <div
                            key={district.districtCode}
                            className="tree-node"
                          >
                            <div className="node-row district-row">
                              <div className="node-content">
                                <button
                                  type="button"
                                  className="expand-toggle"
                                  onClick={() =>
                                    toggleDistrict(district.districtCode)
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
                                  {district.districtName}
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
                                      district.districtCode,
                                      district.districtName,
                                      state.stateCode,
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
                                      key={taluk.talukCode}
                                      className="node-row taluk-row"
                                    >
                                      <div className="node-content">
                                        <div className="expand-toggle-spacer" />
                                        <span className="node-label">
                                          {taluk.talukName}
                                        </span>
                                      </div>
                                      <div className="node-actions">
                                        <EditButton
                                          onClick={() =>
                                            handleEditTaluk(
                                              taluk,
                                              state.stateCode,
                                              district.districtCode,
                                            )
                                          }
                                        />
                                        <DeleteButton
                                          onClick={() =>
                                            handleDeleteClick(
                                              "taluk",
                                              taluk.talukCode,
                                              taluk.talukName,
                                              state.stateCode,
                                              district.districtCode,
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
