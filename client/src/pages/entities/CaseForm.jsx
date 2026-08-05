import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import { CascadingLocationDropdown } from "../../components/CascadingLocationDropdown";
import { SubmitButton, CancelButton } from "../../components/ActionButtons";
import "../../styles/MasterPage.css";
import "../../styles/AdvocateForm.css";
import { useForm } from "../../hooks/useForm";
import { CustomDatePicker } from "../../components/CustomDatePicker";
import { CheckboxDropdown } from "../../components/CheckboxDropdown";
import {
  caseSchema,
  uppercaseAlphaAndSpaces,
  uppercaseAlphaNumAndSpaces,
} from "../../utils/validation";

const EMPTY_FORM = {
  clientIds: [],
  caseNumber: "",
  caseTypeId: "",
  courtId: "",
  petitioner: "",
  petitionerAdvocate: "",
  respondent: "",
  respondentAdvocate: "",
  filingDate: "",
  filingNum: "",
  regNum: "",
  cnrNum: "",
  efilingNum: "",
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
  const [advocates, setAdvocates] = useState([]);
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [selectedTalukCode, setSelectedTalukCode] = useState("");
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
      petitionerAdvocate: formValues.petitionerAdvocate,
      respondent: formValues.respondent,
      respondentAdvocate: formValues.respondentAdvocate,
      filingDate: formValues.filingDate,
      filingNum: formValues.filingNum,
      regNum: formValues.regNum,
      cnrNum: formValues.cnrNum,
      efilingNum: formValues.efilingNum,
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
        const [clientsRes, caseTypesRes, courtsRes, advocatesRes] =
          await Promise.all([
            api.get("/clients"),
            api.get("/masters/case-types"),
            api.get("/masters/courts"),
            api.get("/advocates"),
          ]);

        if (cancelled) return;
        setClients(clientsRes.data);
        setCaseTypes(caseTypesRes.data);
        setCourts(courtsRes.data);
        setAdvocates(advocatesRes.data);

        if (isEdit) {
          const { data } = await api.get(`/cases/${id}`);
          if (cancelled) return;
          setValues({
            clientIds: data.clientIds || [],
            caseNumber: data.caseNumber || "",
            caseTypeId: data.caseTypeId != null ? String(data.caseTypeId) : "",
            courtId: data.courtId != null ? String(data.courtId) : "",
            petitioner: data.petitioner || "",
            petitionerAdvocate: data.petitionerAdvocate || "",
            respondent: data.respondent || "",
            respondentAdvocate: data.respondentAdvocate || "",
            filingDate: data.filingDate ? data.filingDate.slice(0, 10) : "",
            filingNum: data.filingNum || "",
            regNum: data.regNum || "",
            cnrNum: data.cnrNum || "",
            efilingNum: data.efilingNum || "",
            courtName: data.courtName || "",
            advocateIds: data.advocateIds || [],
          });

          // Pre-populate State, District and Taluk filters based on the case's assigned court ID
          const matchedCourt = courtsRes.data.find(
            (c) => String(c.id) === String(data.courtId),
          );
          if (matchedCourt) {
            setSelectedStateCode(
              matchedCourt.State_ID != null ? String(matchedCourt.State_ID) : "",
            );
            setSelectedDistrictCode(
              matchedCourt.District_ID != null ? String(matchedCourt.District_ID) : "",
            );
            setSelectedTalukCode(
              matchedCourt.Taluk_ID != null ? String(matchedCourt.Taluk_ID) : "",
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

  const getAvailableTypesForTaluk = (talukCode) => {
    if (!talukCode) {
      return ["Supreme Court", "High Court", "District Court", "Family Court", "Municipal Court", "Sessions Court"];
    }
    const types = new Set();
    courts.forEach((c) => {
      if (String(c.Taluk_ID) === String(talukCode)) {
        if (c.courtType) {
          types.add(c.courtType);
        }
      }
    });
    return Array.from(types);
  };

  const handleLocationChange = (loc) => {
    setSelectedStateCode(loc.State_ID ? String(loc.State_ID) : "");
    setSelectedDistrictCode(loc.District_ID ? String(loc.District_ID) : "");
    setSelectedTalukCode(loc.Taluk_ID ? String(loc.Taluk_ID) : "");

    if (!loc.State_ID || !loc.District_ID || !loc.Taluk_ID) {
      setSelectedCourtType("");
    } else {
      const nextAvailableTypes = getAvailableTypesForTaluk(loc.Taluk_ID);
      if (selectedCourtType && !nextAvailableTypes.includes(selectedCourtType)) {
        setSelectedCourtType("");
      }
    }
    setValue("courtId", "");
    setValue("courtName", "");
    setValue("advocateIds", []);
  };

  const handleCourtTypeChange = (e) => {
    const value = e.target.value;
    setSelectedCourtType(value);
    setValue("courtId", "");
    setValue("courtName", "");
    setValue("advocateIds", []);
  };

  const handleCourtChange = (e) => {
    const courtIdStr = e.target.value;
    const matched = courts.find((c) => String(c.id) === courtIdStr);
    setValue("courtId", courtIdStr);
    setValue("courtName", matched ? matched.name : "");
    if (!courtIdStr) {
      setValue("advocateIds", []);
    }
  };

  const handleCancel = () => {
    navigate("/case");
  };

  const filteredCourts = courts.filter((c) => {
    const matchState =
      !selectedStateCode || String(c.State_ID) === String(selectedStateCode);
    const matchDistrict =
      !selectedDistrictCode || String(c.District_ID) === String(selectedDistrictCode);
    const matchTaluk =
      !selectedTalukCode || String(c.Taluk_ID) === String(selectedTalukCode);
    const matchType = !selectedCourtType || c.courtType === selectedCourtType;
    return matchState && matchDistrict && matchTaluk && matchType;
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
              autoFocus
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

          <label htmlFor="case-petitioner-advocate">Petitioner Advocate</label>
          <div className="form-input-wrapper">
            <input
              id="case-petitioner-advocate"
              type="text"
              className={errors.petitionerAdvocate ? "input-has-error" : ""}
              {...register("petitionerAdvocate", { transform: (v) => uppercaseAlphaAndSpaces(v, 100) })}
              required
            />
            {errors.petitionerAdvocate && <span className="field-error">{errors.petitionerAdvocate}</span>}
          </div>
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
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

          <label htmlFor="case-respondent-advocate">Respondent Advocate</label>
          <div className="form-input-wrapper">
            <input
              id="case-respondent-advocate"
              type="text"
              className={errors.respondentAdvocate ? "input-has-error" : ""}
              {...register("respondentAdvocate", { transform: (v) => uppercaseAlphaAndSpaces(v, 100) })}
              required
            />
            {errors.respondentAdvocate && <span className="field-error">{errors.respondentAdvocate}</span>}
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

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="case-filing-num">Filing Number</label>
          <div className="form-input-wrapper">
            <input
              id="case-filing-num"
              type="text"
              className={errors.filingNum ? "input-has-error" : ""}
              {...register("filingNum", { transform: (v) => uppercaseAlphaNumAndSpaces(v, 100) })}
              required
            />
            {errors.filingNum && <span className="field-error">{errors.filingNum}</span>}
          </div>

          <label htmlFor="case-reg-num">Registration Number</label>
          <div className="form-input-wrapper">
            <input
              id="case-reg-num"
              type="text"
              className={errors.regNum ? "input-has-error" : ""}
              {...register("regNum", { transform: (v) => uppercaseAlphaNumAndSpaces(v, 100) })}
              required
            />
            {errors.regNum && <span className="field-error">{errors.regNum}</span>}
          </div>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="case-cnr-num">CNR Number</label>
          <div className="form-input-wrapper">
            <input
              id="case-cnr-num"
              type="text"
              className={errors.cnrNum ? "input-has-error" : ""}
              {...register("cnrNum", { transform: (v) => uppercaseAlphaNumAndSpaces(v, 100) })}
              required
            />
            {errors.cnrNum && <span className="field-error">{errors.cnrNum}</span>}
          </div>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="case-efiling-num">E-Filing Number</label>
          <div className="form-input-wrapper">
            <input
              id="case-efiling-num"
              type="text"
              className={errors.efilingNum ? "input-has-error" : ""}
              {...register("efilingNum", { transform: (v) => uppercaseAlphaNumAndSpaces(v, 100) })}
              required
            />
            {errors.efilingNum && <span className="field-error">{errors.efilingNum}</span>}
          </div>
        </div>

        <CascadingLocationDropdown
          State_ID={selectedStateCode}
          District_ID={selectedDistrictCode}
          Taluk_ID={selectedTalukCode}
          onChange={handleLocationChange}
          required
        />

        <div className="advocate-form-row">
          <label htmlFor="case-court-type">Court Type</label>
          <div className="form-input-wrapper">
            <select
              id="case-court-type"
              value={selectedCourtType}
              onChange={handleCourtTypeChange}
              disabled={!selectedStateCode || !selectedDistrictCode || !selectedTalukCode}
              required
            >
              <option value="">Select court type</option>
              {getAvailableTypesForTaluk(selectedTalukCode).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="case-court">Court Name</label>
          <div className="form-input-wrapper">
            <select
              id="case-court"
              className={errors.courtId ? "input-has-error" : ""}
              value={values.courtId}
              onChange={handleCourtChange}
              disabled={!selectedStateCode || !selectedDistrictCode || !selectedTalukCode || !selectedCourtType}
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
              disabled={!selectedStateCode || !selectedDistrictCode || !selectedTalukCode || !selectedCourtType || !values.courtId}
            />
            {errors.advocateIds && <span className="field-error">{errors.advocateIds}</span>}
          </div>
        </div>

        <div className="advocate-form-actions">
          <SubmitButton isEdit={isEdit} saving={saving || isSubmitting} />
          <CancelButton onClick={handleCancel} disabled={saving || isSubmitting} />
        </div>
        <div className="form-mandatory-hint">
          ALL  FIELDS  ARE  MANDATORY<sup>*</sup>
        </div>
      </form>
    </div>
  );
}

export default CaseForm;
