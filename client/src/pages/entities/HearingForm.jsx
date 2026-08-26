import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import DatePicker from "../../components/ui/date-picker";
import TimePicker from "../../components/ui/time-picker";
import SearchableSelect from "../../components/SearchableSelect";
import CheckboxDropdown from "../../components/CheckboxDropdown";
import { SubmitButton, CancelButton } from "../../components/ActionButtons";
import dayjs from "../../utils/datePicker";
import { Scale } from "lucide-react";

const EMPTY_FORM = {
  caseId: "",
  date: "",
  time: "00:00",
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
            time: data.time ? data.time.slice(0, 5) : "00:00",
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

  const handleTimeChange = (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, time: val }));
    setError("");
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

    // if (!form.time) return setError("Hearing time is required.");

    const payload = {
      clientIds: selectedClientIds,
      caseId: Number(form.caseId),
      advocateIds: selectedAdvocateIds,
      date: form.date,
      time: form.time,
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
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 animate-pulse">
        <header className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Scale className="h-7 w-7 shrink-0" />
            </div>
            {isEdit ? "Update Hearing" : "Create Hearing"}
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
            <Scale className="h-7 w-7 shrink-0" />
          </div>
          {isEdit ? "Update Hearing" : "Create Hearing"}
        </h1>
      </header>

      {error && (
        <div className="p-4 text-sm font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl" role="alert">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="hearing-client" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Client Name
          </label>
          <CheckboxDropdown
            id="hearing-client"
            options={clients.map((c) => ({ id: c.id, name: c.clientName }))}
            selectedIds={selectedClientIds}
            onChange={handleClientChange}
            placeholder="Select clients"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="hearing-case" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Case Number
          </label>
          <SearchableSelect
            id="hearing-case"
            value={form.caseId}
            options={cases.map((cs) => ({
              value: String(cs.id),
              label: cs.caseNumber,
            }))}
            onChange={(val) => handleCaseChange({ target: { value: val } })}
            placeholder="Select case"
            searchPlaceholder="Search case..."
            emptyMessage="No cases found."
            disabled={selectedClientIds.length === 0}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="hearing-advocate" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Advocate
          </label>
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

        <div className="space-y-1.5">
          <label htmlFor="hearing-court" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Court Name
          </label>
          <input
            id="hearing-court"
            type="text"
            value={courtName || "—"}
            readOnly
            disabled
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-100/50 text-slate-500 font-semibold cursor-not-allowed outline-none text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="hearing-judge" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Judge Name
          </label>
          <SearchableSelect
            id="hearing-judge"
            value={form.judgeId}
            options={judges.map((j) => ({
              value: String(j.id),
              label: j.name,
            }))}
            onChange={(val) => setForm((f) => ({ ...f, judgeId: val }))}
            placeholder="Select judge"
            searchPlaceholder="Search judge..."
            emptyMessage="No judges found."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label htmlFor="hearing-date" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Hearing Date
            </label>
            <DatePicker
              id="hearing-date"
              min={getTodayDateString()}
              value={form.date}
              onChange={(val) => setForm((f) => ({ ...f, date: val }))}
              required={true}
            />
          </div>

          {/*
          <div className="space-y-1.5">
            <label htmlFor="hearing-time" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Hearing Time
            </label>
            <div className="flex items-center gap-2">
              <TimePicker
                id="hearing-time"
                value={form.time}
                onChange={handleTimeChange}
              />
              {form.time && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-to-tr from-indigo-50 to-indigo-100 text-indigo-750 border border-indigo-200 shadow-sm shrink-0 animate-[fadeIn_0.2s_ease-out]">
                  {getAmPm(form.time)}
                </span>
              )}
            </div>
          </div>
          */}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="hearing-purpose" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Purpose of Hearing
          </label>
          <textarea
            id="hearing-purpose"
            value={form.hearingPurpose}
            onChange={updateField("hearingPurpose")}
            maxLength={250}
            rows={4}
            className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm transition-all focus:ring-4 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50 text-slate-800"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <CancelButton onClick={handleCancel} disabled={saving} />
          <SubmitButton isEdit={isEdit} saving={saving} disabled={saving} />
        </div>
        <div className="text-[10px] font-bold text-red-500 text-right mt-2 uppercase tracking-wider">
          * All fields are mandatory
        </div>
      </form>
    </div>
  );
}

export default HearingForm;
