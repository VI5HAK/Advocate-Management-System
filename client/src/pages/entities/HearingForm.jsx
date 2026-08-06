import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import { CustomDatePicker } from "../../components/CustomDatePicker";
import { CheckboxDropdown } from "../../components/CheckboxDropdown";
import { SubmitButton, CancelButton } from "../../components/ActionButtons";
import dayjs from "../../utils/datePicker";
import "../../styles/MasterPage.css";
import "../../styles/AdvocateForm.css";

const EMPTY_FORM = {
  caseId: "",
  date: "",
  startTime: "",
  endTime: "",
  courtId: "",
  judgeId: "",
  hearingPurpose: "",
};

function toInputValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function getTodayDateString() {
  return dayjs().format("YYYY-MM-DD");
}

function getAmPm(timeString) {
  if (!timeString) return "";
  const [hoursStr] = timeString.split(":");
  const hours = parseInt(hoursStr, 10);
  if (isNaN(hours)) return "";
  return hours >= 12 ? "PM" : "AM";
}

function HearingForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [clients, setClients] = useState([]);
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [cases, setCases] = useState([]);
  const [advocates, setAdvocates] = useState([]);
  const [courts, setCourts] = useState([]);
  const [judges, setJudges] = useState([]);
  const [caseAdvocateIds, setCaseAdvocateIds] = useState([]);
  const [selectedAdvocateIds, setSelectedAdvocateIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [courtName, setCourtName] = useState("");

  const fetchCasesForClients = async (clientIds) => {
    if (!clientIds || clientIds.length === 0) {
      setCases([]);
      return;
    }
    try {
      const results = await Promise.all(
        clientIds.map((cid) => api.get(`/cases?clientId=${cid}`))
      );
      const allCases = [];
      const seen = new Set();
      for (const res of results) {
        for (const c of res.data) {
          if (!seen.has(c.id)) {
            seen.add(c.id);
            allCases.push(c);
          }
        }
      }
      setCases(allCases);
    } catch {
      setError("Failed to fetch cases for the selected clients.");
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [clientsRes, advocatesRes, courtsRes, judgesRes] =
          await Promise.all([
            api.get("/clients"),
            api.get("/advocates"),
            api.get("/masters/courts"),
            api.get("/masters/judges"),
          ]);

        if (cancelled) return;
        setClients(clientsRes.data || []);
        setAdvocates(advocatesRes.data || []);
        setCourts(courtsRes.data || []);
        setJudges(judgesRes.data || []);

        if (isEdit) {
          const { data } = await api.get(`/hearings/${id}`);
          if (cancelled) return;

          setSelectedClientIds(data.clientIds || []);
          await fetchCasesForClients(data.clientIds || []);

          if (data.caseId) {
            const caseDetailRes = await api.get(`/cases/${data.caseId}`);
            if (cancelled) return;
            setCaseAdvocateIds(caseDetailRes.data.advocateIds || []);
            setCourtName(caseDetailRes.data.courtName || "");
          }

          setForm({
            caseId: data.caseId != null ? String(data.caseId) : "",
            date: data.date ? data.date.slice(0, 10) : "",
            startTime: data.startTime ? data.startTime.slice(0, 5) : "",
            endTime: data.endTime ? data.endTime.slice(0, 5) : "",
            courtId: data.courtId != null ? String(data.courtId) : "",
            judgeId: data.judgeId != null ? String(data.judgeId) : "",
            hearingPurpose: toInputValue(data.hearingPurpose),
          });
          setSelectedAdvocateIds(data.advocateIds || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              (isEdit
                ? "Failed to load hearing."
                : "Failed to load dropdown values."),
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

  const handleStartTimeChange = (e) => {
    const val = e.target.value;
    setForm((f) => {
      const updated = { ...f, startTime: val };
      if (getAmPm(val) === "PM" && getAmPm(f.endTime) === "AM") {
        updated.endTime = "";
      }
      return updated;
    });
    setError((prev) =>
      prev.includes("PM") && prev.includes("AM") ? "" : prev,
    );
  };

  const handleEndTimeChange = (e) => {
    const val = e.target.value;
    if (getAmPm(form.startTime) === "PM" && getAmPm(val) === "AM") {
      setError("If the start time is PM, then the end time can only be PM.");
      return;
    }
    setError((prev) =>
      prev.includes("PM") && prev.includes("AM") ? "" : prev,
    );
    setForm((f) => ({ ...f, endTime: val }));
  };

  const handleClientChange = async (newClientIds) => {
    setSelectedClientIds(newClientIds);
    setForm((f) => ({ ...f, caseId: "" }));
    setCases([]);
    setCaseAdvocateIds([]);
    setSelectedAdvocateIds([]);
    await fetchCasesForClients(newClientIds);
  };

  const handleCaseChange = async (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, caseId: val, courtId: "" }));
    setCourtName("");
    setCaseAdvocateIds([]);
    setSelectedAdvocateIds([]);
    if (val) {
      try {
        const caseDetailRes = await api.get(`/cases/${val}`);
        setCaseAdvocateIds(caseDetailRes.data.advocateIds || []);
        if (caseDetailRes.data.courtId) {
          setForm((f) => ({
            ...f,
            courtId: String(caseDetailRes.data.courtId),
          }));
        }
        setCourtName(caseDetailRes.data.courtName || "");
      } catch {
        setError("Failed to fetch case details.");
      }
    }
  };

  const handleCancel = () => {
    navigate("/hearings");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedClientIds.length === 0) return setError("At least one client must be selected.");
    if (!form.caseId) return setError("Case number is required.");
    if (selectedAdvocateIds.length === 0)
      return setError("At least one advocate must be selected.");
    if (!form.courtId) return setError("Court name is required.");
    if (!form.judgeId) return setError("Judge name is required.");
    if (!form.date) return setError("Hearing date is required.");

    const todayStr = getTodayDateString();
    if (form.date < todayStr) {
      return setError("Hearing date must be today or a future date.");
    }

    if (!form.startTime) return setError("Start time is required.");
    if (!form.endTime) return setError("End time is required.");

    if (getAmPm(form.startTime) === "PM" && getAmPm(form.endTime) === "AM") {
      return setError(
        "If the start time is PM, then the end time can only be PM.",
      );
    }

    if (form.startTime >= form.endTime) {
      return setError("End time must be after start time.");
    }

    const payload = {
      clientIds: selectedClientIds,
      caseId: Number(form.caseId),
      advocateIds: selectedAdvocateIds,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      courtId: Number(form.courtId),
      judgeId: Number(form.judgeId),
      hearingPurpose: form.hearingPurpose,
    };

    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await api.put(`/hearings/${id}`, payload);
      } else {
        await api.post("/hearings", payload);
      }
      navigate("/hearings");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isEdit ? "Failed to update hearing." : "Failed to create hearing."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="advocate-form-page">
        <h1 className="advocate-form-title">
          {isEdit ? "Update Hearing" : "Create Hearing"}
        </h1>
        <p className="master-empty">Loading…</p>
      </div>
    );
  }

  return (
    <div className="advocate-form-page">
      <h1 className="advocate-form-title">
        {isEdit ? "Update Hearing" : "Create Hearing"}
      </h1>

      {error && (
        <p className="master-error" role="alert">
          {error}
        </p>
      )}

      <form className="advocate-form" onSubmit={handleSubmit}>
        <div className="advocate-form-row">
          <label htmlFor="hearing-client">Client Name</label>
          <CheckboxDropdown
            id="hearing-client"
            options={clients.map((c) => ({ id: c.id, name: c.clientName }))}
            selectedIds={selectedClientIds}
            onChange={handleClientChange}
            placeholder="Select clients"
          />
        </div>

        <div className="advocate-form-row">
          <label htmlFor="hearing-case">Case Number</label>
          <select
            id="hearing-case"
            value={form.caseId}
            onChange={handleCaseChange}
            required
            disabled={selectedClientIds.length === 0}
          >
            <option value="">Select case</option>
            {cases.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.caseNumber}
              </option>
            ))}
          </select>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="hearing-advocate">Advocate</label>
          <CheckboxDropdown
            id="hearing-advocate"
            options={advocates
              .filter((a) => caseAdvocateIds.includes(a.id))
              .map((a) => ({ id: a.id, name: a.advocateName }))}
            selectedIds={selectedAdvocateIds}
            onChange={(newIds) => setSelectedAdvocateIds(newIds)}
            placeholder="Select advocates"
            disabled={!form.caseId}
          />
        </div>

        <div className="advocate-form-row">
          <label htmlFor="hearing-court">Court Name</label>
          <input
            id="hearing-court"
            type="text"
            value={courtName || "—"}
            readOnly
            disabled
          />
        </div>

        <div className="advocate-form-row">
          <label htmlFor="hearing-judge">Judge Name</label>
          <select
            id="hearing-judge"
            value={form.judgeId}
            onChange={updateField("judgeId")}
            required
          >
            <option value="">Select judge</option>
            {judges.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="hearing-date">Hearing Date</label>
          <CustomDatePicker
            id="hearing-date"
            min={getTodayDateString()}
            value={form.date}
            onChange={updateField("date")}
            required
          />
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="hearing-start-time">Start Time</label>
          <div className="time-input-wrapper">
            <input
              id="hearing-start-time"
              type="time"
              value={form.startTime}
              onChange={handleStartTimeChange}
              required
            />
            {form.startTime && (
              <span className="time-am-pm-label">
                {getAmPm(form.startTime)}
              </span>
            )}
          </div>
          <label htmlFor="hearing-end-time">End Time</label>
          <div className="time-input-wrapper">
            <input
              id="hearing-end-time"
              type="time"
              value={form.endTime}
              onChange={handleEndTimeChange}
              required
              min={getAmPm(form.startTime) === "PM" ? "12:00" : undefined}
            />
            {form.endTime && (
              <span className="time-am-pm-label">{getAmPm(form.endTime)}</span>
            )}
          </div>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="hearing-purpose">Purpose of Hearing</label>
          <textarea
            id="hearing-purpose"
            value={form.hearingPurpose}
            onChange={updateField("hearingPurpose")}
            maxLength={250}
            rows={4}
          />
        </div>

        <div className="advocate-form-actions">
          <SubmitButton isEdit={isEdit} saving={saving} disabled={saving} />
          <CancelButton onClick={handleCancel} disabled={saving} />
        </div>
        <div className="form-mandatory-hint">
          ALL FIELDS ARE MANDATORY<sup>*</sup>
        </div>
      </form>
    </div>
  );
}

export default HearingForm;
