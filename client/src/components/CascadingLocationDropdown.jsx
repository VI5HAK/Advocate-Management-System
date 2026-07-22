import { useEffect, useState } from "react";
import api from "../api/client";

/**
 * CascadingLocationDropdown Component
 * Renders three dropdown inputs (State, District, Taluk) that are linked.
 *
 * @param {string|number} stateCode - Currently selected State Code.
 * @param {string|number} districtCode - Currently selected District Code.
 * @param {string|number} talukCode - Currently selected Taluk Code.
 * @param {Function} onChange - Callback triggered when selections change: ({ stateCode, stateName, districtCode, districtName, talukCode, talukName }) => void
 * @param {boolean} required - Whether selecting these options is required in the form.
 * @param {Object} errors - Validation errors object { stateCode, districtCode, talukCode }.
 */
export function CascadingLocationDropdown({
  stateCode = "",
  districtCode = "",
  talukCode = "",
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

  // Fetch districts when stateCode changes
  useEffect(() => {
    if (!stateCode) {
      setDistricts([]);
      return;
    }
    let active = true;
    async function fetchDistricts() {
      setLoadingDistricts(true);
      try {
        const res = await api.get("/locations/districts", {
          params: { stateCode },
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
  }, [stateCode]);

  // Fetch taluks when districtCode changes
  useEffect(() => {
    if (!districtCode) {
      setTaluks([]);
      return;
    }
    let active = true;
    async function fetchTaluks() {
      setLoadingTaluks(true);
      try {
        const res = await api.get("/locations/taluks", {
          params: { districtCode },
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
  }, [districtCode]);

  const handleStateChange = (e) => {
    const val = e.target.value;
    const selectedState = states.find((s) => String(s.stateCode) === String(val));
    onChange({
      stateCode: val ? Number(val) : "",
      stateName: selectedState ? selectedState.stateName : "",
      districtCode: "",
      districtName: "",
      talukCode: "",
      talukName: "",
    });
  };

  const handleDistrictChange = (e) => {
    const val = e.target.value;
    const selectedState = states.find((s) => String(s.stateCode) === String(stateCode));
    const selectedDistrict = districts.find((d) => String(d.districtCode) === String(val));
    onChange({
      stateCode: stateCode ? Number(stateCode) : "",
      stateName: selectedState ? selectedState.stateName : "",
      districtCode: val ? Number(val) : "",
      districtName: selectedDistrict ? selectedDistrict.districtName : "",
      talukCode: "",
      talukName: "",
    });
  };

  const handleTalukChange = (e) => {
    const val = e.target.value;
    const selectedState = states.find((s) => String(s.stateCode) === String(stateCode));
    const selectedDistrict = districts.find((d) => String(d.districtCode) === String(districtCode));
    const selectedTaluk = taluks.find((t) => String(t.talukCode) === String(val));
    onChange({
      stateCode: stateCode ? Number(stateCode) : "",
      stateName: selectedState ? selectedState.stateName : "",
      districtCode: districtCode ? Number(districtCode) : "",
      districtName: selectedDistrict ? selectedDistrict.districtName : "",
      talukCode: val ? Number(val) : "",
      talukName: selectedTaluk ? selectedTaluk.talukName : "",
    });
  };

  return (
    <>
      <div className={rowClassName}>
        <label htmlFor="location-state">State</label>
        <div className={inputWrapperClassName || undefined}>
          <select
            id="location-state"
            value={stateCode || ""}
            onChange={handleStateChange}
            required={required}
            className={`${errors.stateCode ? "input-has-error" : ""} ${selectClassName}`}
            disabled={loadingStates}
          >
            <option value="">
              {loadingStates ? "Loading states..." : "Select state"}
            </option>
            {states.map((s) => (
              <option key={s.stateCode} value={s.stateCode}>
                {s.stateName}
              </option>
            ))}
          </select>
          {errors.stateCode && <span className="field-error">{errors.stateCode}</span>}
        </div>
      </div>

      <div className={rowClassName}>
        <label htmlFor="location-district">District</label>
        <div className={inputWrapperClassName || undefined}>
          <select
            id="location-district"
            value={districtCode || ""}
            onChange={handleDistrictChange}
            required={required}
            disabled={!stateCode || loadingDistricts}
            className={`${errors.districtCode ? "input-has-error" : ""} ${selectClassName}`}
          >
            <option value="">
              {loadingDistricts ? "Loading districts..." : "Select district"}
            </option>
            {districts.map((d) => (
              <option key={d.districtCode} value={d.districtCode}>
                {d.districtName}
              </option>
            ))}
          </select>
          {errors.districtCode && <span className="field-error">{errors.districtCode}</span>}
        </div>
      </div>

      <div className={rowClassName}>
        <label htmlFor="location-taluk">Taluk</label>
        <div className={inputWrapperClassName || undefined}>
          <select
            id="location-taluk"
            value={talukCode || ""}
            onChange={handleTalukChange}
            required={required}
            disabled={!districtCode || loadingTaluks}
            className={`${errors.talukCode ? "input-has-error" : ""} ${selectClassName}`}
          >
            <option value="">
              {loadingTaluks ? "Loading taluks..." : "Select taluk"}
            </option>
            {taluks.map((t) => (
              <option key={t.talukCode} value={t.talukCode}>
                {t.talukName}
              </option>
            ))}
          </select>
          {errors.talukCode && <span className="field-error">{errors.talukCode}</span>}
        </div>
      </div>
    </>
  );
}

export default CascadingLocationDropdown;
