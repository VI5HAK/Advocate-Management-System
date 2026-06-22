import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import "../../styles/MasterPage.css";
import "../../styles/AdvocateForm.css";

const EMPTY_FORM = {
  clientId: "",
  caseNumber: "",
  caseTypeId: "",
  courtId: "",
  petitioner: "",
  respondent: "",
  filingDate: "",
  courtName: "",
  advocateId: "",
};

function CaseForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
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
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [selectedAdvocateIds, setSelectedAdvocateIds] = useState([]);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [advocateDropdownOpen, setAdvocateDropdownOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".custom-checkbox-dropdown")) {
        setClientDropdownOpen(false);
        setAdvocateDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
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
          setSelectedClientIds(data.clientIds || []);
          setSelectedAdvocateIds(data.advocateIds || []);
          setForm({
            clientId: data.clientId != null ? String(data.clientId) : "",
            caseNumber: data.caseNumber || "",
            caseTypeId: data.caseTypeId != null ? String(data.caseTypeId) : "",
            courtId: data.courtId != null ? String(data.courtId) : "",
            petitioner: data.petitioner || "",
            respondent: data.respondent || "",
            filingDate: data.filingDate ? data.filingDate.slice(0, 10) : "",
            courtName: data.courtName || "",
            advocateId: data.advocateId != null ? String(data.advocateId) : "",
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
  }, [id, isEdit]);

  const updateField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const getAvailableTypesForDistrict = (districtId) => {
    if (!districtId) {
      return ["Supreme Court", "High Court", "District Court", "Family Court"];
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
    setForm((f) => ({ ...f, courtId: "", courtName: "" }));
  };

  const handleCourtTypeChange = (e) => {
    const value = e.target.value;
    setSelectedCourtType(value);
    setForm((f) => ({ ...f, courtId: "", courtName: "" }));
  };

  const handleCourtChange = (e) => {
    const courtIdStr = e.target.value;
    const matched = courts.find((c) => String(c.id) === courtIdStr);
    setForm((f) => ({
      ...f,
      courtId: courtIdStr,
      courtName: matched ? matched.name : "",
    }));
  };

  const handleCancel = () => {
    navigate("/case");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedClientIds.length === 0) return setError("At least one client must be selected.");
    if (!form.caseNumber.trim()) return setError("Case number is required.");
    if (!form.caseTypeId) return setError("Case type is required.");
    if (!form.courtId) return setError("Court name is required.");
    if (selectedAdvocateIds.length === 0) return setError("At least one advocate must be selected.");
    if (!form.petitioner) return setError("Petitioner is required.");
    if (!form.respondent) return setError("Respondent is required.");
    if (!form.filingDate) return setError("Filing date is required.");
    if (!form.courtName) return setError("Court name is required.");

    const payload = {
      clientIds: selectedClientIds,
      caseNumber: form.caseNumber.trim(),
      caseTypeId: Number(form.caseTypeId),
      courtId: Number(form.courtId),
      petitioner: form.petitioner,
      respondent: form.respondent,
      filingDate: form.filingDate,
      courtName: form.courtName,
      advocateIds: selectedAdvocateIds,
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
          <div className="custom-checkbox-dropdown">
            <button
              id="case-client"
              type="button"
              className="dropdown-trigger-btn"
              onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
            >
              {selectedClientIds.length > 0
                ? clients
                    .filter((c) => selectedClientIds.includes(c.id))
                    .map((c) => c.clientName)
                    .join(", ")
                : "Select clients"}
              <span className="dropdown-arrow">▼</span>
            </button>
            {clientDropdownOpen && (
              <div className="dropdown-options-list">
                {clients.map((c) => {
                  const isChecked = selectedClientIds.includes(c.id);
                  return (
                    <label key={c.id} className="dropdown-option-item">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedClientIds(selectedClientIds.filter((id) => id !== c.id));
                          } else {
                            setSelectedClientIds([...selectedClientIds, c.id]);
                          }
                        }}
                      />
                      <span className="option-label-text">{c.clientName}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="case-number">Case Number</label>
          <input
            id="case-number"
            type="text"
            value={form.caseNumber}
            onChange={updateField("caseNumber")}
            required
            autoFocus
          />
        </div>

        <div className="advocate-form-row">
          <label htmlFor="case-type">Case Type</label>
          <select
            id="case-type"
            value={form.caseTypeId}
            onChange={updateField("caseTypeId")}
            required
          >
            <option value="">Select case type</option>
            {caseTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="case-petitioner">Petitioner</label>
          <input
            id="case-petitioner"
            type="text"
            value={form.petitioner}
            onChange={updateField("petitioner")}
          />

          <label htmlFor="case-respondent">Respondent</label>
          <input
            id="case-respondent"
            type="text"
            value={form.respondent}
            onChange={updateField("respondent")}
          />
        </div>

        <div className="advocate-form-row">
          <label htmlFor="case-filing-date">Filing Date</label>
          <input
            id="case-filing-date"
            type="date"
            value={form.filingDate}
            onChange={updateField("filingDate")}
          />
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
          <select
            id="case-court"
            value={form.courtId}
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
        </div>

        <div className="advocate-form-row advocate-form-row-wide">
          <label htmlFor="case-advocate">Assign Advocate</label>
          <div className="custom-checkbox-dropdown">
            <button
              id="case-advocate"
              type="button"
              className="dropdown-trigger-btn"
              onClick={() => setAdvocateDropdownOpen(!advocateDropdownOpen)}
            >
              {selectedAdvocateIds.length > 0
                ? advocates
                    .filter((a) => selectedAdvocateIds.includes(a.id))
                    .map((a) => a.advocateName)
                    .join(", ")
                : "Select advocates"}
              <span className="dropdown-arrow">▼</span>
            </button>
            {advocateDropdownOpen && (
              <div className="dropdown-options-list">
                {advocates.map((a) => {
                  const isChecked = selectedAdvocateIds.includes(a.id);
                  return (
                    <label key={a.id} className="dropdown-option-item">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedAdvocateIds(selectedAdvocateIds.filter((id) => id !== a.id));
                          } else {
                            setSelectedAdvocateIds([...selectedAdvocateIds, a.id]);
                          }
                        }}
                      />
                      <span className="option-label-text">{a.advocateName}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="advocate-form-actions">
          <button
            type="submit"
            className={`master-btn ${isEdit ? "btn-update" : "btn-create"}`}
            disabled={saving}
          >
            {saving ? "Saving…" : isEdit ? "Update" : "Submit"}
          </button>
          <button
            type="button"
            className="master-btn master-btn-outline"
            onClick={handleCancel}
            disabled={saving}
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
