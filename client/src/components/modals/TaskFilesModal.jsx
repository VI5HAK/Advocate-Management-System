import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Paperclip, Upload, Download, Trash2, FileText } from "lucide-react";
import entityService from "../../api/services/entity.service";
import { useAuth } from "../../context/AuthContext";
import { formatRemarkDate } from "../../utils/formatters";

export function TaskFilesModal({ task, onClose }) {
  const { user } = useAuth();
  const isAdvocate = user?.role === "advocate";

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState("");

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await entityService.getTaskFiles(task.id);
      setFiles(data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load task files.");
    } finally {
      setLoading(false);
    }
  }, [task.id]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError("File size is too large and cannot be over 50mb");
        setSelectedFile(null);
        e.target.value = "";
        return;
      }
      setError("");
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError("File size is too large and cannot be over 50mb");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const { data } = await entityService.uploadTaskFile(task.id, formData);
      setFiles(data || []);
      setSelectedFile(null);
      // Reset input element value
      const fileInput = document.getElementById("task-file-input");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    setDeletingId(fileId);
    setError("");
    try {
      const { data } = await entityService.deleteTaskFile(task.id, fileId);
      setFiles(data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete file.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadFile = async (file) => {
    setDownloadingId(file.id);
    setError("");
    try {
      const response = await entityService.downloadTaskFile(task.id, file.id);
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", file.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download file. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh] animate-[scaleUp_0.2s_ease-out]">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Paperclip className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                Task Files & Documents
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

          {/* Upload Form */}
          <form onSubmit={handleUpload} className="space-y-3">
            <label
              htmlFor="task-file-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Upload New Attachment
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                id="task-file-input"
                type="file"
                onChange={handleFileChange}
                className="flex-1 text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all border border-slate-200 rounded-xl p-1.5 cursor-pointer"
              />
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="btn-grad-create px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload File"}
              </button>
            </div>
          </form>

          <hr className="border-slate-100" />

          {/* Files List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Attached Files ({files.length})
            </h3>

            {loading ? (
              <div className="text-center py-6 text-xs text-slate-400 font-medium">
                Loading files...
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-medium bg-slate-50 rounded-xl border border-slate-100">
                No files uploaded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100/80 hover:bg-slate-100/50 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-indigo-100/70 text-indigo-700 shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {f.fileName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Uploaded by{" "}
                          <span className="font-semibold text-slate-700">
                            {f.authorName} ({f.role})
                          </span>{" "}
                          • {formatRemarkDate(f.uploadedDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(f)}
                        disabled={downloadingId === f.id}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors inline-flex items-center justify-center cursor-pointer disabled:opacity-50"
                        title={`Download ${f.fileName}`}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(f.id)}
                        disabled={isAdvocate || deletingId === f.id}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:border-slate-200"
                        title={isAdvocate ? "File deletion is disabled for advocates" : "Delete file"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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

export default TaskFilesModal;
