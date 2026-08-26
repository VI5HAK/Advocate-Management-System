import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import DatePicker from "../../components/ui/date-picker";
import TimePicker from "../../components/ui/time-picker";
import { SubmitButton, CancelButton } from "../../components/ActionButtons";
import SearchableSelect from "../../components/SearchableSelect";
import CheckboxDropdown from "../../components/CheckboxDropdown";
import dayjs from "../../utils/datePicker";
import { Calendar } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isExpired, setIsExpired] = useState(false);

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

  const handleStartTimeChange = (e) => {
    const val = e.target.value;
    setForm((f) => {
      const updated = { ...f, startTime: val };
      if (getAmPm(val) === "PM" && getAmPm(f.endTime) === "AM") {
        updated.endTime = "";
      }
      return updated;
    });
    setError("");
  };

  const handleEndTimeChange = (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, endTime: val }));
    setError("");
  };

  const handleDateChange = (e) => {
    setForm((f) => ({ ...f, filingDate: e.target.value }));
    setError("");
  };

  const handleAdvocateChange = (newIds) => {
    setSelectedAdvocateIds(newIds);
    setError("");
  };

  const handleClientChange = async (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, clientId: val, caseId: "" }));
    setCases([]);
    setCaseAdvocateIds([]);
    setSelectedAdvocateIds([]);
    setError("");
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
    setError("");
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

    if (!isEdit && form.filingDate === todayStr) {
      const currentTimeStr = dayjs().format("HH:mm");
      if (form.startTime < currentTimeStr) {
        return setError("Appointment start time cannot be in the past.");
      }
    }

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
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 animate-pulse">
        <header className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="h-7 w-7 shrink-0" />
            </div>
            {isEdit ? "Update Appointment" : "Create Appointment"}
          </h1>
        </header>
        <div className="py-8 text-center text-slate-400 font-medium">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
      <header className="border-b border-slate-100 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Calendar className="h-7 w-7 shrink-0" />
          </div>
          {isEdit ? "Update Appointment" : "Create Appointment"}
        </h1>
      </header>

      {error && (
        <div className="p-4 text-sm font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl" role="alert">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="appointment-client" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Client Name
          </label>
          <SearchableSelect
            id="appointment-client"
            value={form.clientId}
            options={clients.map((c) => ({
              value: String(c.id),
              label: c.clientName,
            }))}
            onChange={(val) => handleClientChange({ target: { value: val } })}
            placeholder="Select client"
            searchPlaceholder="Search client..."
            emptyMessage="No clients found."
            disabled={isExpired}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="appointment-case" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Case Number
          </label>
          <SearchableSelect
            id="appointment-case"
            value={form.caseId}
            options={[
              { value: "NO_CASE", label: "NO CASE" },
              ...cases.map((cs) => ({
                value: String(cs.id),
                label: cs.caseNumber,
              })),
            ]}
            onChange={(val) => handleCaseChange({ target: { value: val } })}
            placeholder="Select case"
            searchPlaceholder="Search case..."
            emptyMessage="No cases found."
            disabled={!form.clientId || isExpired}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="appointment-advocate" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Advocate
          </label>
          <CheckboxDropdown
            id="appointment-advocate"
            options={advocates
              .filter((a) => caseAdvocateIds.includes(a.id))
              .map((a) => ({ id: a.id, name: a.advocateName }))}
            selectedIds={selectedAdvocateIds}
            onChange={handleAdvocateChange}
            placeholder="Select advocates"
            disabled={!form.caseId || isExpired}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="appointment-filing-date" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Date
          </label>
          <DatePicker
            id="appointment-filing-date"
            min={getTodayDateString()}
            value={form.filingDate}
            onChange={(val) => handleDateChange({ target: { value: val } })}
            required={true}
            disabled={isExpired}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label htmlFor="appointment-start-date" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Start Time
            </label>
            <div className="flex items-center gap-2">
              <TimePicker
                id="appointment-start-date"
                value={form.startTime}
                onChange={handleStartTimeChange}
                disabled={isExpired}
              />
              {form.startTime && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-to-tr from-indigo-50 to-indigo-100 text-indigo-750 border border-indigo-200 shadow-sm shrink-0 animate-[fadeIn_0.2s_ease-out]">
                  {getAmPm(form.startTime)}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="appointment-end-date" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              End Time
            </label>
            <div className="flex items-center gap-2">
              <TimePicker
                id="appointment-end-date"
                value={form.endTime}
                onChange={handleEndTimeChange}
                disabled={isExpired}
              />
              {form.endTime && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-to-tr from-indigo-50 to-indigo-100 text-indigo-750 border border-indigo-200 shadow-sm shrink-0 animate-[fadeIn_0.2s_ease-out]">
                  {getAmPm(form.endTime)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <CancelButton onClick={handleCancel} disabled={saving} />
          <SubmitButton isEdit={isEdit} saving={saving} disabled={saving || isExpired} />
        </div>
        <div className="text-[10px] font-bold text-red-500 text-right mt-2 uppercase tracking-wider">
          * All fields are mandatory
        </div>
      </form>
    </div>
  );
}

export default AppointmentForm;

