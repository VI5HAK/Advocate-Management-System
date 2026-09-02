import React from "react";

function ConfirmDialog({ isOpen, title = "Confirm Delete", message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 sm:p-6 animate-[fadeIn_0.2s_ease-out]"
      onClick={onCancel}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-[fadeIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-7 pt-7 pb-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
        </div>
        <div className="px-7 py-2">
          <p className="text-sm font-medium text-slate-600 leading-relaxed">{message}</p>
        </div>
        <div className="px-7 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            className="h-11 px-5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all cursor-pointer shadow-sm"
            onClick={onCancel}
          >
            No, Cancel
          </button>
          <button
            type="button"
            className="h-11 px-6 rounded-xl text-xs sm:text-sm font-bold text-white btn-grad-delete uppercase tracking-wider transition-all cursor-pointer shadow-md"
            onClick={onConfirm}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
