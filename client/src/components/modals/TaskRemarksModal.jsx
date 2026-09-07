import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, MessageSquare, Send } from "lucide-react";
import entityService from "../../api/services/entity.service";
import { formatRemarkDate } from "../../utils/formatters";

export function TaskRemarksModal({ task, onClose }) {
  const [remarks, setRemarks] = useState([]);
  const [newRemark, setNewRemark] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchRemarks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await entityService.getTaskRemarks(task.id);
      setRemarks(data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load task remarks.");
    } finally {
      setLoading(false);
    }
  }, [task.id]);

  useEffect(() => {
    fetchRemarks();
  }, [fetchRemarks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newRemark.trim()) return;

    setSaving(true);
    setError("");
    try {
      const { data } = await entityService.addTaskRemark(task.id, {
        remarkText: newRemark.trim(),
      });
      setRemarks(data || []);
      setNewRemark("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add remark.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh] animate-[scaleUp_0.2s_ease-out]">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                Task Remarks
              </h2>
              <p className="text-xs text-slate-500 font-medium truncate max-w-xs sm:max-w-md">
                Task: {task.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <label
              htmlFor="task-remark-text"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Add New Remark
            </label>
            <textarea
              id="task-remark-text"
              className="w-full h-24 p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none font-medium text-slate-800"
              placeholder="Type your task update or remark here..."
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || !newRemark.trim()}
                className="btn-grad-create px-4 py-2 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                {saving ? "Posting..." : "Post Remark"}
              </button>
            </div>
          </form>

          <hr className="border-slate-100" />

          {/* Remarks History */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Remarks History ({remarks.length})
            </h3>

            {loading ? (
              <div className="text-center py-6 text-xs text-slate-400 font-medium">
                Loading remarks...
              </div>
            ) : remarks.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-slate-100">
                No remarks added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {remarks.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-indigo-950">
                        {r.authorName}{" "}
                        <span className="ml-1 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                          {r.role}
                        </span>
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {formatRemarkDate(r.createdDate)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                      {r.remarkText}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default TaskRemarksModal;
