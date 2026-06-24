import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import "../../styles/MasterPage.css";
import "../../styles/AdvocateForm.css";

function CustomDatePicker({ id, value, onChange, min, required }) {
  const dateInputRef = useRef(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (value) {
      const display = value.split("-").reverse().join("/");
      setInputValue(display);
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleClick = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch (err) {
        dateInputRef.current.focus();
      }
    }
  };

  const handleInputChange = (e) => {
    let val = e.target.value;
    
    // Automatically insert slashes as user types
    if (val.length > inputValue.length) {
      if (val.length === 2 || val.length === 5) {
        val += "/";
      }
    }
    
    // Limit to 10 characters (DD/MM/YYYY)
    if (val.length <= 10) {
      setInputValue(val);
    }

    const dmyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = val.match(dmyPattern);
    if (match) {
      const dd = match[1];
      const mm = match[2];
      const yyyy = match[3];
      const isoDate = `${yyyy}-${mm}-${dd}`;
      const d = new Date(isoDate);
      if (!isNaN(d.getTime())) {
        onChange({ target: { value: isoDate } });
      }
    } else if (val === "") {
      onChange({ target: { value: "" } });
    }
  };

  const handleBlur = () => {
    const dmyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (inputValue && !inputValue.match(dmyPattern)) {
      if (value) {
        setInputValue(value.split("-").reverse().join("/"));
      } else {
        setInputValue("");
      }
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
      <input
        type="text"
        className="master-input-text"
        value={inputValue}
        placeholder="DD/MM/YYYY"
        onChange={handleInputChange}
        onBlur={handleBlur}
        style={{ width: "100%", height: "3rem", padding: "0 2.5rem 0 0.75rem", border: "1px solid #9ca3af", borderRadius: "6px", boxSizing: "border-box", background: "#fff", fontSize: "1.05rem" }}
      />
      <button
        type="button"
        onClick={handleClick}
        style={{
          position: "absolute",
          right: "0.75rem",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "1.2rem",
          display: "flex",
          alignItems: "center",
          color: "#6b7280"
        }}
      >
        📅
      </button>
      <input
        id={id}
        ref={dateInputRef}
        type="date"
        min={min}
        value={value || ""}
        onChange={onChange}
        required={required}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: "none"
        }}
      />
    </div>
  );
}

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
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

          const caseDetailRes = await api.get(`/cases/${data.caseId}`);
          if (cancelled) return;
          setCaseAdvocateIds(caseDetailRes.data.advocateIds || []);

          setForm({
            clientId: data.clientId != null ? String(data.clientId) : "",
            caseId: data.caseId != null ? String(data.caseId) : "",
            filingDate: data.filingDate ? data.filingDate.slice(0, 10) : "",
            startTime: toInputValue(data.startTime),
            endTime: toInputValue(data.endTime),
          });
          setSelectedAdvocateIds(data.advocateIds || []);
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
    if (val) {
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
      caseId: Number(form.caseId),
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
          <label htmlFor="appointment-advocate">Advocate</label>
          <div className="custom-checkbox-dropdown">
            <button
              id="appointment-advocate"
              type="button"
              className="dropdown-trigger-btn"
              onClick={() => setAdvocateDropdownOpen(!advocateDropdownOpen)}
              disabled={!form.caseId}
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
              min={getAmPm(form.startTime) === "PM" ? "12:00" : undefined}
            />
            {form.endTime && (
              <span className="time-am-pm-label">{getAmPm(form.endTime)}</span>
            )}
          </div>
        </div>

        <div className="advocate-form-actions">
          <button type="submit" className={`master-btn ${isEdit ? "btn-update" : "btn-create"}`} disabled={saving}>
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
          ALL FIELDS ARE MANDATORY<sup>*</sup>
        </div>
      </form>
    </div>
  );
}

export default AppointmentForm;

