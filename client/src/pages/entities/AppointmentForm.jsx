import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import { CustomDatePicker } from "../../components/CustomDatePicker";
import { SubmitButton, CancelButton } from "../../components/ActionButtons";
import dayjs from "../../utils/datePicker";
import "../../styles/MasterPage.css";
import "../../styles/AdvocateForm.css";

const EMPTY_FORM = {
  clientId: "",
  caseId: "",
  filingDate: "",
  startTime: "",
  endTime: "",
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

function AppointmentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [advocates, setAdvocates] = useState([]);
  const [caseAdvocateIds, setCaseAdvocateIds] = useState([]);
  const [selectedAdvocateIds, setSelectedAdvocateIds] = useState([]);
  const [advocateDropdownOpen, setAdvocateDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".custom-checkbox-dropdown")) {
        setAdvocateDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [clientsRes, advocatesRes] = await Promise.all([
          api.get("/clients"),
          api.get("/advocates"),
        ]);

        if (cancelled) return;
        setClients(clientsRes.data);
        setAdvocates(advocatesRes.data);

        if (isEdit) {
          const { data } = await api.get(`/appointments/${id}`);
          if (cancelled) return;

          const casesRes = await api.get(`/cases?clientId=${data.clientId}`);
          if (cancelled) return;
          setCases(casesRes.data);

          if (data.caseId) {
            const caseDetailRes = await api.get(`/cases/${data.caseId}`);
            if (cancelled) return;
            setCaseAdvocateIds(caseDetailRes.data.advocateIds || []);
          } else {
            setCaseAdvocateIds(advocatesRes.data.map((a) => a.id));
          }

          setForm({
            clientId: data.clientId != null ? String(data.clientId) : "",
            caseId: data.caseId != null ? String(data.caseId) : "NO_CASE",
            filingDate: data.filingDate ? data.filingDate.slice(0, 10) : "",
            startTime: toInputValue(data.startTime),
            endTime: toInputValue(data.endTime),
          });
          setSelectedAdvocateIds(data.advocateIds || []);

          if (data.status === "completed" || data.status === "deleted") {
            setIsExpired(true);
            setError("This appointment cannot be modified as the modification window (15 minutes after start time) has expired.");
          } else {
            const startStr = `${data.filingDate.slice(0, 10)}T${toInputValue(data.startTime)}`;
            const appointmentStart = new Date(startStr).getTime();
            const current = Date.now();
            const diffMinutes = (current - appointmentStart) / (1000 * 60);
            if (diffMinutes > 15) {
              setIsExpired(true);
              setError("This appointment cannot be modified as the modification window (15 minutes after start time) has expired.");
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            (isEdit
              ? "Failed to load appointment."
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
    setError((prev) => (prev.includes("PM") && prev.includes("AM") ? "" : prev));
  };

  const handleEndTimeChange = (e) => {
    const val = e.target.value;
    if (getAmPm(form.startTime) === "PM" && getAmPm(val) === "AM") {
      setError("If the start time is PM, then the end time can only be PM.");
      return;
    }
    setError((prev) => (prev.includes("PM") && prev.includes("AM") ? "" : prev));
    setForm((f) => ({ ...f, endTime: val }));
  };

  const handleClientChange = async (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, clientId: val, caseId: "" }));
    setCases([]);
    setCaseAdvocateIds([]);
    setSelectedAdvocateIds([]);
    if (val) {
      try {
        const casesRes = await api.get(`/cases?clientId=${val}`);
        setCases(casesRes.data);
      } catch {
        setError("Failed to fetch cases for this client.");
      }
    }
  };

  const handleCaseChange = async (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, caseId: val }));
    setCaseAdvocateIds([]);
    setSelectedAdvocateIds([]);
    if (val === "NO_CASE") {
      setCaseAdvocateIds(advocates.map((a) => a.id));
    } else if (val) {
      try {
        const caseDetailRes = await api.get(`/cases/${val}`);
        setCaseAdvocateIds(caseDetailRes.data.advocateIds || []);
      } catch {
        setError("Failed to fetch advocates assigned to this case.");
      }
    }
  };

  const handleCancel = () => {
    navigate("/appointments");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clientId) return setError("Client name is required.");
    if (!form.caseId) return setError("Case number is required.");
    if (selectedAdvocateIds.length === 0) return setError("At least one advocate must be selected.");
    if (!form.filingDate) return setError("Filing date is required.");

    const todayStr = getTodayDateString();
    if (form.filingDate < todayStr) {
      return setError("Appointment date must be today or a future date.");
    }

    if (!form.startTime) return setError("Start time is required.");
    if (!form.endTime) return setError("End time is required.");

    if (getAmPm(form.startTime) === "PM" && getAmPm(form.endTime) === "AM") {
      return setError("If the start time is PM, then the end time can only be PM.");
    }

    const payload = {
      clientId: Number(form.clientId),
      caseId: form.caseId === "NO_CASE" ? null : Number(form.caseId),
      advocateIds: selectedAdvocateIds,
      filingDate: form.filingDate,
      startTime: form.startTime,
      endTime: form.endTime,
    };

    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await api.put(`/appointments/${id}`, payload);
      } else {
        await api.post("/appointments", payload);
      }
      navigate("/appointments");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (isEdit
          ? "Failed to update appointment."
          : "Failed to create appointment."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="advocate-form-page">
        <h1 className="advocate-form-title">
          {isEdit ? "Update Appointment" : "Create Appointment"}
        </h1>
        <p className="master-empty">Loading…</p>
      </div>
    );
  }

  return (
    <div className="advocate-form-page">
      <h1 className="advocate-form-title">
        {isEdit ? "Update Appointment" : "Create Appointment"}
      </h1>

      {error && (
        <p className="master-error" role="alert">
          {error}
        </p>
      )}

      <form className="advocate-form" onSubmit={handleSubmit}>
        <div className="advocate-form-row">
          <label htmlFor="appointment-client">Client Name</label>
          <select
            id="appointment-client"
            value={form.clientId}
            onChange={handleClientChange}
            required
            disabled={isExpired}
          >
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.clientName}
              </option>
            ))}
          </select>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="appointment-case">Case Number</label>
          <select
            id="appointment-case"
            value={form.caseId}
            onChange={handleCaseChange}
            required
            disabled={isExpired}
          >
            <option value="">Select case</option>
            <option value="NO_CASE">NO CASE</option>
            {cases.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.caseNumber}
              </option>
            ))}
          </select>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="appointment-advocate">Advocate</label>
          <div className="custom-checkbox-dropdown">
            <button
              id="appointment-advocate"
              type="button"
              className="dropdown-trigger-btn"
              onClick={() => setAdvocateDropdownOpen(!advocateDropdownOpen)}
              disabled={!form.caseId || isExpired}
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
                {advocates
                  .filter((a) => caseAdvocateIds.includes(a.id))
                  .map((a) => {
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

        <div className="advocate-form-row">
          <label htmlFor="appointment-filing-date"> Date</label>
          <CustomDatePicker
            id="appointment-filing-date"
            min={getTodayDateString()}
            value={form.filingDate}
            onChange={updateField("filingDate")}
            required
            disabled={isExpired}
          />
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="appointment-start-date">Start Time</label>
          <div className="time-input-wrapper">
            <input
              id="appointment-start-date"
              type="time"
              value={form.startTime}
              onChange={handleStartTimeChange}
              required
              disabled={isExpired}
            />
            {form.startTime && (
              <span className="time-am-pm-label">{getAmPm(form.startTime)}</span>
            )}
          </div>
          <label htmlFor="appointment-end-date">End Time</label>
          <div className="time-input-wrapper">
            <input
              id="appointment-end-date"
              type="time"
              value={form.endTime}
              onChange={handleEndTimeChange}
              required
              disabled={isExpired}
              min={getAmPm(form.startTime) === "PM" ? "12:00" : undefined}
            />
            {form.endTime && (
              <span className="time-am-pm-label">{getAmPm(form.endTime)}</span>
            )}
          </div>
        </div>

        <div className="advocate-form-actions">
          <SubmitButton isEdit={isEdit} saving={saving} disabled={saving || isExpired} />
          <CancelButton onClick={handleCancel} disabled={saving} />
        </div>
        <div className="form-mandatory-hint">
          ALL FIELDS ARE MANDATORY<sup>*</sup>
        </div>
      </form>
    </div>
  );
}

export default AppointmentForm;

