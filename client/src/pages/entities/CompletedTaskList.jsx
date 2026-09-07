import { useEffect, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import entityService from "../../api/services/entity.service";
import { formatDateDMY } from "../../utils/formatters";
import {
  EditButton,
  DeleteButton,
  HelpButton,
} from "../../components/common/ActionButtons";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import TaskRemarksModal from "../../components/modals/TaskRemarksModal";
import TaskFilesModal from "../../components/modals/TaskFilesModal";

const PRIORITY_BADGE_CLASSES = {
  Low: "bg-slate-100 text-slate-700 border-slate-200",
  Medium: "bg-blue-50 text-blue-700 border-blue-200",
  High: "bg-amber-50 text-amber-700 border-amber-200",
  Urgent: "bg-red-50 text-red-700 border-red-200",
};

export function CompletedTaskList() {
  const { user } = useAuth();
  const isAdvocate = user?.role === "advocate";
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Accordion state
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  // Modal states
  const [remarksTask, setRemarksTask] = useState(null);
  const [filesTask, setFilesTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const fetchCompletedTasks = async (searchTerm = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await entityService.getCompletedTasks(searchTerm);
      setTasks(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load completed tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedTasks();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCompletedTasks(search);
  };

  const toggleExpand = (taskId) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  const handleDelete = (t) => {
    setTaskToDelete(t);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    setError("");
    try {
      await entityService.deleteTask(taskToDelete.id);
      setTaskToDelete(null);
      fetchCompletedTasks(search);
    } catch (err) {
      setTaskToDelete(null);
      setError(err.response?.data?.message || "Failed to delete task.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 shrink-0" />
          </div>
          <span className="truncate">Completed Tasks</span>
          <HelpButton title="Completed Tasks" />
        </h1>
      </header>

      {/* Search Bar */}
      <form className="flex gap-3" onSubmit={handleSearchSubmit}>
        <div className="relative flex-1 flex">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="flex-1 w-full h-11 pl-11 pr-10 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-50 focus:bg-white"
            placeholder="Search completed tasks by name, client, advocate, case, category..."
            value={search}
            onChange={handleSearchChange}
          />
          {search && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-7 w-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              onClick={() => {
                setSearch("");
                fetchCompletedTasks("");
              }}
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-11 px-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] transition-all text-xs sm:text-sm font-semibold text-slate-750 inline-flex items-center gap-1.5 cursor-pointer bg-white"
        >
          <span className="hidden sm:inline">Search</span>
          <svg
            className="h-4 w-4"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </form>

      {error && (
        <div
          className="p-4 text-sm font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Task List Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 font-medium shadow-sm">
          Loading completed tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 font-medium shadow-sm">
          No completed tasks found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-250 bg-slate-50/75">
                <th className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]">
                  Task Name
                </th>
                {!isAdvocate && (
                  <th className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px] text-right w-[180px]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((t) => {
                const isExpanded = expandedTaskId === t.id;

                return (
                  <Fragment key={t.id}>
                    <tr className="hover:bg-indigo-50/30 even:bg-slate-200/60 transition-colors">
                      <td className="px-5 py-4 text-slate-700 font-semibold align-middle">
                        <button
                          type="button"
                          onClick={() => toggleExpand(t.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-400 hover:text-slate-700 inline-flex items-center gap-2 text-left"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 shrink-0 text-indigo-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                          )}
                          <span className="font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                            {t.name}
                          </span>
                        </button>
                      </td>
                      {!isAdvocate && (
                        <td className="px-5 py-4 align-middle">
                          <div className="flex gap-2 justify-end">
                            <EditButton
                              onClick={() => navigate(`/tasks/${t.id}/edit`)}
                            />
                            <DeleteButton onClick={() => handleDelete(t)} />
                          </div>
                        </td>
                      )}
                    </tr>

                    {/* Accordion Detail Row */}
                    {isExpanded && (
                      <tr className="bg-indigo-50/10">
                        <td
                          colSpan={isAdvocate ? 1 : 2}
                          className="px-8 py-5 border-t border-slate-100"
                        >
                          <div className="space-y-4 animate-[fadeIn_0.15s_ease-out]">
                            <div className="flex items-center justify-between border-b border-emerald-100/50 pb-2">
                              <h4 className="text-sm font-bold text-emerald-900">
                                Completed Task Overview ({t.name})
                              </h4>
                              {/* Popup Trigger Buttons */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setRemarksTask(t)}
                                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-xs font-bold text-emerald-700 shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                                  Remarks
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFilesTask(t)}
                                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-xs font-bold text-emerald-700 shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Paperclip className="h-3.5 w-3.5 text-emerald-600" />
                                  Files
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-xs">
                              <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                  Advocate Name
                                </span>
                                <span className="text-slate-800 font-bold text-sm">
                                  {t.advocateName || "—"}
                                </span>
                              </div>

                              <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                  Priority
                                </span>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                                    PRIORITY_BADGE_CLASSES[t.priority] ||
                                    PRIORITY_BADGE_CLASSES.Medium
                                  }`}
                                >
                                  {t.priority}
                                </span>
                              </div>

                              <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                  Start Date
                                </span>
                                <span className="text-slate-700 font-semibold text-sm">
                                  {formatDateDMY(t.startDate)}
                                </span>
                              </div>

                              <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                  End Date
                                </span>
                                <span className="text-slate-700 font-semibold text-sm">
                                  {formatDateDMY(t.endDate)}
                                </span>
                              </div>

                              <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                  Category
                                </span>
                                <span className="text-slate-700 font-semibold text-sm">
                                  {t.catName || "—"}
                                </span>
                              </div>

                              <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                  Client Name
                                </span>
                                <span className="text-slate-700 font-semibold text-sm">
                                  {t.clientName || "—"}
                                </span>
                              </div>

                              <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                  Case Number
                                </span>
                                <span className="text-slate-700 font-semibold text-sm">
                                  {t.caseNumber || "—"}
                                </span>
                              </div>

                              <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                  Status
                                </span>
                                <span className="text-slate-700 font-semibold text-sm">
                                  {t.statusName || "—"}
                                </span>
                              </div>

                              {t.description && (
                                <div className="col-span-2 md:col-span-4">
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                    Description
                                  </span>
                                  <p className="text-slate-700 font-medium text-xs whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-100">
                                    {t.description}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Remarks Modal Popup */}
      {remarksTask && (
        <TaskRemarksModal
          task={remarksTask}
          onClose={() => setRemarksTask(null)}
        />
      )}

      {/* Files Modal Popup */}
      {filesTask && (
        <TaskFilesModal
          task={filesTask}
          onClose={() => setFilesTask(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Confirm Task Deletion"
        message={
          taskToDelete
            ? `Are you sure you want to delete completed task "${taskToDelete.name}"?`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}

export default CompletedTaskList;
