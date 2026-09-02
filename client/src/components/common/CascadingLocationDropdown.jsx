import { useEffect, useState } from "react";
import masterService from "../../api/services/master.service";
import SearchableSelect from "./SearchableSelect";

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
        const res = await masterService.getStates();
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
        const res = await masterService.getDistricts(State_ID);
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
        const res = await masterService.getTaluks(District_ID);
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

  const handleStateChange = (val) => {
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

  const handleDistrictChange = (val) => {
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

  const handleTalukChange = (val) => {
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

  const stateOptions = states.map((s) => ({ value: s.State_ID, label: s.State_Name }));
  const districtOptions = districts.map((d) => ({ value: d.District_ID, label: d.District_Name }));
  const talukOptions = taluks.map((t) => ({ value: t.Taluk_ID, label: t.Taluk_Name }));

  return (
    <>
      <div className={rowClassName}>
        <label htmlFor="location-state">State</label>
        <div className={inputWrapperClassName || undefined}>
          <SearchableSelect
            id="location-state"
            value={State_ID || ""}
            options={stateOptions}
            onChange={handleStateChange}
            placeholder={loadingStates ? "Loading states..." : "Select state"}
            searchPlaceholder="Search state..."
            emptyMessage="No states found."
            disabled={loadingStates}
            className={errors.State_ID ? "border-red-500 focus:ring-red-500/10" : ""}
          />
          {errors.State_ID && <span className="text-red-500 text-xs font-semibold mt-1 block animate-[fadeIn_0.15s_ease-out]">{errors.State_ID}</span>}
        </div>
      </div>

      <div className={rowClassName}>
        <label htmlFor="location-district">District</label>
        <div className={inputWrapperClassName || undefined}>
          <SearchableSelect
            id="location-district"
            value={District_ID || ""}
            options={districtOptions}
            onChange={handleDistrictChange}
            placeholder={
              !State_ID
                ? "Select a state first"
                : loadingDistricts
                ? "Loading districts..."
                : "Select district"
            }
            searchPlaceholder="Search district..."
            emptyMessage="No districts found."
            disabled={!State_ID || loadingDistricts}
            className={errors.District_ID ? "border-red-500 focus:ring-red-500/10" : ""}
          />
          {errors.District_ID && <span className="text-red-500 text-xs font-semibold mt-1 block animate-[fadeIn_0.15s_ease-out]">{errors.District_ID}</span>}
        </div>
      </div>

      <div className={rowClassName}>
        <label htmlFor="location-taluk">Taluk</label>
        <div className={inputWrapperClassName || undefined}>
          <SearchableSelect
            id="location-taluk"
            value={Taluk_ID || ""}
            options={talukOptions}
            onChange={handleTalukChange}
            placeholder={
              !District_ID
                ? "Select a district first"
                : loadingTaluks
                ? "Loading taluks..."
                : "Select taluk"
            }
            searchPlaceholder="Search taluk..."
            emptyMessage="No taluks found."
            disabled={!District_ID || loadingTaluks}
            className={errors.Taluk_ID ? "border-red-500 focus:ring-red-500/10" : ""}
          />
          {errors.Taluk_ID && <span className="text-red-500 text-xs font-semibold mt-1 block animate-[fadeIn_0.15s_ease-out]">{errors.Taluk_ID}</span>}
        </div>
      </div>
    </>
  );
}

export default CascadingLocationDropdown;
