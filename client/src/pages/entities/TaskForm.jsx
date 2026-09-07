import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import entityService from "../../api/services/entity.service";
import masterService from "../../api/services/master.service";
import DatePicker from "../../components/ui/date-picker";
import { SubmitButton, CancelButton } from "../../components/common/ActionButtons";
import SearchableSelect from "../../components/common/SearchableSelect";
import { uppercaseAlphaNumAndSpaces } from "../../utils/validation";
import { CheckSquare } from "lucide-react";

const PRIORITY_OPTIONS = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  clientId: "",
  caseId: "",
  catId: "",
  advocateId: "",
  priority: "Medium",
  startDate: "",
  endDate: "",
  statusId: "",
};

export function TaskForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [advocates, setAdvocates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [clientsRes, advocatesRes, catRes, statusRes] = await Promise.all([
          entityService.getClients(),
          entityService.getAdvocates(),
          masterService.getMasterItems("/masters/task-categories"),
          masterService.getMasterItems("/masters/task-statuses"),
        ]);

        if (cancelled) return;
        setClients(clientsRes.data || []);
        setAdvocates(advocatesRes.data || []);
        setCategories(catRes.data || []);
        setStatuses(statusRes.data || []);

        if (isEdit) {
          const { data } = await entityService.getTask(id);
          if (cancelled) return;

          if (data.clientId) {
            const casesRes = await entityService.getByPath(
              `/cases?clientId=${data.clientId}`
            );
            if (!cancelled) setCases(casesRes.data || []);
          }

          setForm({
            name: data.name || "",
            description: data.description || "",
            clientId: data.clientId ? String(data.clientId) : "",
            caseId: data.caseId ? String(data.caseId) : "",
            catId: data.catId ? String(data.catId) : "",
            advocateId: data.advocateId ? String(data.advocateId) : "",
            priority: data.priority || "Medium",
            startDate: data.startDate ? data.startDate.slice(0, 10) : "",
            endDate: data.endDate ? data.endDate.slice(0, 10) : "",
            statusId: data.statusId ? String(data.statusId) : "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              (isEdit ? "Failed to load task." : "Failed to load options.")
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

  const handleClientChange = async (val) => {
    setForm((f) => ({ ...f, clientId: val, caseId: "" }));
    setCases([]);
    setError("");
    if (val) {
      try {
        const casesRes = await entityService.getByPath(`/cases?clientId=${val}`);
        setCases(casesRes.data || []);
      } catch {
        setError("Failed to fetch cases for this client.");
      }
    }
  };

  const handleCancel = () => {
    navigate("/tasks");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Task Name is required.");
    if (!form.catId) return setError("Task Category is required.");
    if (!form.advocateId) return setError("Advocate is required.");
    if (!form.statusId) return setError("Task Status is required.");
    if (!form.startDate) return setError("Start Date is required.");

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      return setError("End date cannot be prior to start date.");
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      clientId: form.clientId ? Number(form.clientId) : null,
      caseId: form.caseId ? Number(form.caseId) : null,
      catId: Number(form.catId),
      advocateId: Number(form.advocateId),
      priority: form.priority,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      statusId: Number(form.statusId),
    };

    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await entityService.updateTask(id, payload);
      } else {
        await entityService.createTask(payload);
      }
      navigate("/tasks");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isEdit ? "Failed to update task." : "Failed to create task.")
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
              <CheckSquare className="h-7 w-7 shrink-0" />
            </div>
            {isEdit ? "Update Task" : "Create Task"}
          </h1>
        </header>
        <div className="py-8 text-center text-slate-400 font-medium">
          Loading task options…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
      <header className="border-b border-slate-100 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <CheckSquare className="h-7 w-7 shrink-0" />
          </div>
          {isEdit ? "Update Task" : "Create Task"}
        </h1>
      </header>

      {error && (
        <div
          className="p-4 text-sm font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl"
          role="alert"
        >
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Task Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="task-name"
            className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
          >
            Task Name <span className="text-red-500">*</span>
          </label>
          <input
            id="task-name"
            type="text"
            className="w-full h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold text-slate-800"
            placeholder="Enter task name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: uppercaseAlphaNumAndSpaces(e.target.value, 150) }))}
            required
          />
        </div>

        {/* Task Description */}
        <div className="space-y-1.5">
          <label
            htmlFor="task-description"
            className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
          >
            Description
          </label>
          <textarea
            id="task-description"
            className="w-full h-24 p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none font-medium text-slate-800"
            placeholder="Enter task description or instruction details..."
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </div>

        {/* Category & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label
              htmlFor="task-category"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              Task Category <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              id="task-category"
              value={form.catId}
              options={categories.map((c) => ({
                value: String(c.id),
                label: c.name,
              }))}
              onChange={(val) => setForm((f) => ({ ...f, catId: val }))}
              placeholder="Select category"
              searchPlaceholder="Search category..."
              emptyMessage="No categories found."
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="task-status"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              Task Status <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              id="task-status"
              value={form.statusId}
              options={statuses.map((s) => ({
                value: String(s.id),
                label: s.name,
              }))}
              onChange={(val) => setForm((f) => ({ ...f, statusId: val }))}
              placeholder="Select status"
              searchPlaceholder="Search status..."
              emptyMessage="No statuses found."
            />
          </div>
        </div>

        {/* Advocate & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label
              htmlFor="task-advocate"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              Advocate Name <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              id="task-advocate"
              value={form.advocateId}
              options={advocates.map((a) => ({
                value: String(a.id),
                label: a.advocateName,
              }))}
              onChange={(val) => setForm((f) => ({ ...f, advocateId: val }))}
              placeholder="Select advocate"
              searchPlaceholder="Search advocate..."
              emptyMessage="No advocates found."
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="task-priority"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              id="task-priority"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              className="w-full h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold text-slate-800 cursor-pointer"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Client & Case (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label
              htmlFor="task-client"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              Client Name (Optional)
            </label>
            <SearchableSelect
              id="task-client"
              value={form.clientId}
              options={clients.map((c) => ({
                value: String(c.id),
                label: c.clientName,
              }))}
              onChange={handleClientChange}
              placeholder="Select client"
              searchPlaceholder="Search client..."
              emptyMessage="No clients found."
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="task-case"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              Case Number (Optional)
            </label>
            <SearchableSelect
              id="task-case"
              value={form.caseId}
              options={cases.map((cs) => ({
                value: String(cs.id),
                label: cs.caseNumber,
              }))}
              onChange={(val) => setForm((f) => ({ ...f, caseId: val }))}
              placeholder="Select case"
              searchPlaceholder="Search case..."
              emptyMessage="No cases found."
              disabled={!form.clientId}
            />
          </div>
        </div>

        {/* Start Date & End Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label
              htmlFor="task-start-date"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              Start Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              id="task-start-date"
              value={form.startDate}
              onChange={(val) => setForm((f) => ({ ...f, startDate: val }))}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="task-end-date"
              className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              End Date
            </label>
            <DatePicker
              id="task-end-date"
              value={form.endDate}
              min={form.startDate || undefined}
              onChange={(val) => setForm((f) => ({ ...f, endDate: val }))}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <CancelButton onClick={handleCancel} disabled={saving} />
          <SubmitButton isEdit={isEdit} saving={saving} disabled={saving} />
        </div>
      </form>
    </div>
  );
}

export default TaskForm;
