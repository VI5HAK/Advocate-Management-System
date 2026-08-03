import { useEffect, useState } from "react";
import api from "../api/client";

/**
 * CascadingLocationDropdown Component
 * Renders three dropdown inputs (State, District, Taluk) that are linked.
 *
 * @param {string|number} State_ID - Currently selected State Code.
 * @param {string|number} District_ID - Currently selected District Code.
 * @param {string|number} Taluk_ID - Currently selected Taluk Code.
 * @param {Function} onChange - Callback triggered when selections change: ({ State_ID, State_Name, District_ID, District_Name, Taluk_ID, Taluk_Name }) => void
 * @param {boolean} required - Whether selecting these options is required in the form.
 * @param {Object} errors - Validation errors object { State_ID, District_ID, Taluk_ID }.
 */
export function CascadingLocationDropdown({
  State_ID = "",
  District_ID = "",
  Taluk_ID = "",
  onChange,
  required = false,
  errors = {},
  rowClassName = "advocate-form-row",
  inputWrapperClassName = "form-input-wrapper",
  selectClassName = "",
}) {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [taluks, setTaluks] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTaluks, setLoadingTaluks] = useState(false);

  // Fetch states on mount
  useEffect(() => {
    let active = true;
    async function fetchStates() {
      setLoadingStates(true);
      try {
        const res = await api.get("/locations/states");
        if (active) setStates(res.data);
      } catch (err) {
        console.error("Failed to fetch states:", err);
      } finally {
        if (active) setLoadingStates(false);
      }
    }
    fetchStates();
    return () => {
      active = false;
    };
  }, []);

  // Fetch districts when State_ID changes
  useEffect(() => {
    if (!State_ID) {
      setDistricts([]);
      return;
    }
    let active = true;
    async function fetchDistricts() {
      setLoadingDistricts(true);
      try {
        const res = await api.get("/locations/districts", {
          params: { State_ID },
        });
        if (active) setDistricts(res.data);
      } catch (err) {
        console.error("Failed to fetch districts:", err);
      } finally {
        if (active) setLoadingDistricts(false);
      }
    }
    fetchDistricts();
    return () => {
      active = false;
    };
  }, [State_ID]);

  // Fetch taluks when District_ID changes
  useEffect(() => {
    if (!District_ID) {
      setTaluks([]);
      return;
    }
    let active = true;
    async function fetchTaluks() {
      setLoadingTaluks(true);
      try {
        const res = await api.get("/locations/taluks", {
          params: { District_ID },
        });
        if (active) setTaluks(res.data);
      } catch (err) {
        console.error("Failed to fetch taluks:", err);
      } finally {
        if (active) setLoadingTaluks(false);
      }
    }
    fetchTaluks();
    return () => {
      active = false;
    };
  }, [District_ID]);

  const handleStateChange = (e) => {
    const val = e.target.value;
    const selectedState = states.find((s) => String(s.State_ID) === String(val));
    onChange({
      State_ID: val ? Number(val) : "",
      State_Name: selectedState ? selectedState.State_Name : "",
      District_ID: "",
      District_Name: "",
      Taluk_ID: "",
      Taluk_Name: "",
    });
  };

  const handleDistrictChange = (e) => {
    const val = e.target.value;
    const selectedState = states.find((s) => String(s.State_ID) === String(State_ID));
    const selectedDistrict = districts.find((d) => String(d.District_ID) === String(val));
    onChange({
      State_ID: State_ID ? Number(State_ID) : "",
      State_Name: selectedState ? selectedState.State_Name : "",
      District_ID: val ? Number(val) : "",
      District_Name: selectedDistrict ? selectedDistrict.District_Name : "",
      Taluk_ID: "",
      Taluk_Name: "",
    });
  };

  const handleTalukChange = (e) => {
    const val = e.target.value;
    const selectedState = states.find((s) => String(s.State_ID) === String(State_ID));
    const selectedDistrict = districts.find((d) => String(d.District_ID) === String(District_ID));
    const selectedTaluk = taluks.find((t) => String(t.Taluk_ID) === String(val));
    onChange({
      State_ID: State_ID ? Number(State_ID) : "",
      State_Name: selectedState ? selectedState.State_Name : "",
      District_ID: District_ID ? Number(District_ID) : "",
      District_Name: selectedDistrict ? selectedDistrict.District_Name : "",
      Taluk_ID: val ? Number(val) : "",
      Taluk_Name: selectedTaluk ? selectedTaluk.Taluk_Name : "",
    });
  };

  return (
    <>
      <div className={rowClassName}>
        <label htmlFor="location-state">State</label>
        <div className={inputWrapperClassName || undefined}>
          <select
            id="location-state"
            value={State_ID || ""}
            onChange={handleStateChange}
            required={required}
            className={`${errors.State_ID ? "input-has-error" : ""} ${selectClassName}`}
            disabled={loadingStates}
          >
            <option value="">
              {loadingStates ? "Loading states..." : "Select state"}
            </option>
            {states.map((s) => (
              <option key={s.State_ID} value={s.State_ID}>
                {s.State_Name}
              </option>
            ))}
          </select>
          {errors.State_ID && <span className="field-error">{errors.State_ID}</span>}
        </div>
      </div>

      <div className={rowClassName}>
        <label htmlFor="location-district">District</label>
        <div className={inputWrapperClassName || undefined}>
          <select
            id="location-district"
            value={District_ID || ""}
            onChange={handleDistrictChange}
            required={required}
            disabled={!State_ID || loadingDistricts}
            className={`${errors.District_ID ? "input-has-error" : ""} ${selectClassName}`}
          >
            <option value="">
              {loadingDistricts ? "Loading districts..." : "Select district"}
            </option>
            {districts.map((d) => (
              <option key={d.District_ID} value={d.District_ID}>
                {d.District_Name}
              </option>
            ))}
          </select>
          {errors.District_ID && <span className="field-error">{errors.District_ID}</span>}
        </div>
      </div>

      <div className={rowClassName}>
        <label htmlFor="location-taluk">Taluk</label>
        <div className={inputWrapperClassName || undefined}>
          <select
            id="location-taluk"
            value={Taluk_ID || ""}
            onChange={handleTalukChange}
            required={required}
            disabled={!District_ID || loadingTaluks}
            className={`${errors.Taluk_ID ? "input-has-error" : ""} ${selectClassName}`}
          >
            <option value="">
              {loadingTaluks ? "Loading taluks..." : "Select taluk"}
            </option>
            {taluks.map((t) => (
              <option key={t.Taluk_ID} value={t.Taluk_ID}>
                {t.Taluk_Name}
              </option>
            ))}
          </select>
          {errors.Taluk_ID && <span className="field-error">{errors.Taluk_ID}</span>}
        </div>
      </div>
    </>
  );
}

export default CascadingLocationDropdown;
