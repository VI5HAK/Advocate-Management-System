import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import "../../styles/MasterPage.css";
import "../../styles/AdvocateForm.css";
import { useForm } from "../../hooks/useForm";
import { CustomDatePicker } from "../../components/CustomDatePicker";
import { CheckboxDropdown } from "../../components/CheckboxDropdown";
import {
  caseSchema,
  uppercaseAlphaAndSpaces,
} from "../../utils/validation";

const EMPTY_FORM = {
  clientIds: [],
  caseNumber: "",
  caseTypeId: "",
  courtId: "",
  petitioner: "",
  respondent: "",
  filingDate: "",
  courtName: "",
  advocateIds: [],
};

function CaseForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [caseTypes, setCaseTypes] = useState([]);
  const [courts, setCourts] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [advocates, setAdvocates] = useState([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedCourtType, setSelectedCourtType] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (formValues) => {
    const payload = {
      clientIds: formValues.clientIds,
      caseNumber: formValues.caseNumber.trim(),
      caseTypeId: Number(formValues.caseTypeId),
      courtId: Number(formValues.courtId),
      petitioner: formValues.petitioner,
      respondent: formValues.respondent,
      filingDate: formValues.filingDate,
      courtName: formValues.courtName,
      advocateIds: formValues.advocateIds,
    };

    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await api.put(`/cases/${id}`, payload);
      } else {
        await api.post("/cases", payload);
      }
      navigate("/case");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (isEdit ? "Failed to update case." : "Failed to create case."),
      );
    } finally {
      setSaving(false);
    }
  };

  const {
    values,
    errors,
    setValues,
    isSubmitting,
    handleSubmit,
    register,
    setValue,
  } = useForm({
    initialValues: EMPTY_FORM,
    schema: caseSchema,
    onSubmit: handleSave,
  });

  const today = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [clientsRes, caseTypesRes, courtsRes, advocatesRes, districtsRes] =
          await Promise.all([
            api.get("/clients"),
            api.get("/masters/case-types"),
            api.get("/masters/courts"),
            api.get("/advocates"),
            api.get("/masters/districts"),
          ]);

        if (cancelled) return;
        setClients(clientsRes.data);
        setCaseTypes(caseTypesRes.data);
        setCourts(courtsRes.data);
        setAdvocates(advocatesRes.data);
        setDistricts(districtsRes.data);

        if (isEdit) {
          const { data } = await api.get(`/cases/${id}`);
          if (cancelled) return;
          setValues({
            clientIds: data.clientIds || [],
            caseNumber: data.caseNumber || "",
            caseTypeId: data.caseTypeId != null ? String(data.caseTypeId) : "",
            courtId: data.courtId != null ? String(data.courtId) : "",
            petitioner: data.petitioner || "",
            respondent: data.respondent || "",
            filingDate: data.filingDate ? data.filingDate.slice(0, 10) : "",
            courtName: data.courtName || "",
            advocateIds: data.advocateIds || [],
          });

          // Pre-populate District and Court Type filters based on the case's assigned court ID
          const matchedCourt = courtsRes.data.find(
            (c) => String(c.id) === String(data.courtId),
          );
          if (matchedCourt) {
            setSelectedDistrictId(
              matchedCourt.districtId != null ? String(matchedCourt.districtId) : "",
            );
            setSelectedCourtType(matchedCourt.courtType || "");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            (isEdit ? "Failed to load case." : "Failed to load dropdowns."),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, setValues]);

  const getAvailableTypesForDistrict = (districtId) => {
    if (!districtId) {
      return ["Supreme Court", "High Court", "District Court", "Family Court", "Municipal Court", "Sessions Court"];
    }
    const types = new Set();
    courts.forEach((c) => {
      if (String(c.districtId) === String(districtId)) {
        if (c.courtType) {
          types.add(c.courtType);
        }
      }
    });
    return Array.from(types);
  };

  const handleDistrictChange = (e) => {
    const value = e.target.value;
    setSelectedDistrictId(value);

    const nextAvailableTypes = getAvailableTypesForDistrict(value);
    if (selectedCourtType && !nextAvailableTypes.includes(selectedCourtType)) {
      setSelectedCourtType("");
    }
    setValue("courtId", "");
    setValue("courtName", "");
  };

  const handleCourtTypeChange = (e) => {
    const value = e.target.value;
    setSelectedCourtType(value);
    setValue("courtId", "");
    setValue("courtName", "");
  };

  const handleCourtChange = (e) => {
    const courtIdStr = e.target.value;
    const matched = courts.find((c) => String(c.id) === courtIdStr);
    setValue("courtId", courtIdStr);
    setValue("courtName", matched ? matched.name : "");
  };

  const handleCancel = () => {
    navigate("/case");
  };

  const filteredCourts = courts.filter((c) => {
    const matchDistrict =
      !selectedDistrictId || String(c.districtId) === String(selectedDistrictId);
    const matchType = !selectedCourtType || c.courtType === selectedCourtType;
    return matchDistrict && matchType;
  });

  if (loading) {
    return (
      <div className="advocate-form-page">
        <h1 className="advocate-form-title">
          {isEdit ? "Update Case" : "Create Case"}
        </h1>
        <p className="master-empty">Loading…</p>
      </div>
    );
  }

  return (
    <div className="advocate-form-page">
      <h1 className="advocate-form-title">
        {isEdit ? "Update Case" : "Create Case"}
      </h1>

      {error && (
        <p className="master-error" role="alert">
          {error}
        </p>
      )}

      <form className="advocate-form" onSubmit={handleSubmit}>
        <div className="advocate-form-row">
          <label htmlFor="case-client">Client Name</label>
          <div className="form-input-wrapper">
            <CheckboxDropdown
              id="case-client"
              options={clients.map((c) => ({ id: c.id, name: c.clientName }))}
              selectedIds={values.clientIds}
              onChange={(newIds) => {
                setValue("clientIds", newIds);
              }}
              placeholder="Select clients"
            />
            {errors.clientIds && <span className="field-error">{errors.clientIds}</span>}
          </div>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="case-number">Case Number</label>
          <div className="form-input-wrapper">
            <input
              id="case-number"
              type="text"
              className={errors.caseNumber ? "input-has-error" : ""}
              {...register("caseNumber")}
              required
              autoFocus
            />
            {errors.caseNumber && <span className="field-error">{errors.caseNumber}</span>}
          </div>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="case-type">Case Type</label>
          <div className="form-input-wrapper">
            <select
              id="case-type"
              className={errors.caseTypeId ? "input-has-error" : ""}
              {...register("caseTypeId")}
              required
            >
              <option value="">Select case type</option>
              {caseTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.caseTypeId && <span className="field-error">{errors.caseTypeId}</span>}
          </div>
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="case-petitioner">Petitioner</label>
          <div className="form-input-wrapper">
            <input
              id="case-petitioner"
              type="text"
              className={errors.petitioner ? "input-has-error" : ""}
              {...register("petitioner", { transform: (v) => uppercaseAlphaAndSpaces(v, 49) })}
              required
            />
            {errors.petitioner && <span className="field-error">{errors.petitioner}</span>}
          </div>

          <label htmlFor="case-respondent">Respondent</label>
          <div className="form-input-wrapper">
            <input
              id="case-respondent"
              type="text"
              className={errors.respondent ? "input-has-error" : ""}
              {...register("respondent", { transform: (v) => uppercaseAlphaAndSpaces(v, 49) })}
              required
            />
            {errors.respondent && <span className="field-error">{errors.respondent}</span>}
          </div>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="case-filing-date">Filing Date</label>
          <div className="form-input-wrapper">
            <CustomDatePicker
              id="case-filing-date"
              value={values.filingDate}
              onChange={(e) => setValue("filingDate", e.target.value)}
              max={today}
              required
            />
            {errors.filingDate && <span className="field-error">{errors.filingDate}</span>}
          </div>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="case-district">District</label>
          <select
            id="case-district"
            value={selectedDistrictId}
            onChange={handleDistrictChange}
            required
          >
            <option value="">Select district</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="case-court-type">Court Type</label>
          <select
            id="case-court-type"
            value={selectedCourtType}
            onChange={handleCourtTypeChange}
            required
          >
            <option value="">Select court type</option>
            {getAvailableTypesForDistrict(selectedDistrictId).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="case-court">Court Name</label>
          <div className="form-input-wrapper">
            <select
              id="case-court"
              className={errors.courtId ? "input-has-error" : ""}
              value={values.courtId}
              onChange={handleCourtChange}
              required
            >
              <option value="">Select court</option>
              {filteredCourts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.courtId && <span className="field-error">{errors.courtId}</span>}
          </div>
        </div>

        <div className="advocate-form-row advocate-form-row-wide">
          <label htmlFor="case-advocate">Assign Advocate</label>
          <div className="form-input-wrapper">
            <CheckboxDropdown
              id="case-advocate"
              options={advocates.map((a) => ({ id: a.id, name: a.advocateName }))}
              selectedIds={values.advocateIds}
              onChange={(newIds) => {
                setValue("advocateIds", newIds);
              }}
              placeholder="Select advocates"
            />
            {errors.advocateIds && <span className="field-error">{errors.advocateIds}</span>}
          </div>
        </div>

        <div className="advocate-form-actions">
          <button
            type="submit"
            className={`master-btn ${isEdit ? "btn-update" : "btn-create"}`}
            disabled={saving || isSubmitting}
          >
            {saving || isSubmitting ? "Saving…" : isEdit ? "Update" : "Submit"}
          </button>
          <button
            type="button"
            className="master-btn master-btn-outline"
            onClick={handleCancel}
            disabled={saving || isSubmitting}
          >
            Cancel
          </button>
        </div>
        <div className="form-mandatory-hint">
          ALL  FIELDS  ARE  MANDATORY<sup>*</sup>
        </div>
      </form>
    </div>
  );
}

export default CaseForm;
