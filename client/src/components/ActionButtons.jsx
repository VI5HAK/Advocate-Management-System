import React from "react";

// 1. CreateButton (Used on listing headers to open a create form)
export function CreateButton({ onClick, label = "Create", disabled, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-1.5 h-10 w-10 sm:w-auto p-0 sm:px-5 rounded-xl text-xs sm:text-sm font-bold text-white btn-grad-create active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer tracking-wide"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      <span className="hidden sm:inline">{label}</span>
      <svg className="h-5 w-5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  );
}

// 2. EditButton / UpdateButton (Used inside tables/lists actions column)
export function EditButton({ onClick, label = "Update", disabled, children, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-bold text-white btn-grad-update active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer tracking-wide"
      onClick={onClick}
      disabled={disabled}
      title={label}
      {...props}
    >
      {children ? children : (
        <>
          <span className="hidden sm:inline">{label}</span>
          <svg className="h-4 w-4 sm:h-3.5 sm:w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </>
      )}
    </button>
  );
}

// 3. DeleteButton (Used inside tables/lists actions column)
export function DeleteButton({ onClick, label = "Delete", disabled, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-bold text-white btn-grad-delete active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer tracking-wide"
      onClick={onClick}
      disabled={disabled}
      title={label}
      {...props}
    >
      <span className="hidden sm:inline">{label}</span>
      <svg className="h-4 w-4 sm:h-3.5 sm:w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </button>
  );
}

// 4. SubmitButton / SaveButton (Used in forms to submit create or edit state)
export function SubmitButton({ isEdit, saving, label, ...props }) {
  const defaultLabel = isEdit ? "Update" : "Submit";
  return (
    <button
      type="submit"
      className={`inline-flex items-center justify-center h-10 px-6 rounded-xl text-xs sm:text-sm font-bold text-white active:scale-[0.97] cursor-pointer disabled:opacity-50 disabled:pointer-events-none tracking-wide ${
        isEdit ? "btn-grad-update" : "btn-grad-create"
      }`}
      disabled={saving}
      {...props}
    >
      {saving ? "Saving…" : (label || defaultLabel)}
    </button>
  );
}

// 5. CancelButton (Used in forms to go back/cancel)
export function CancelButton({ onClick, label = "Cancel", disabled, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-700 hover:bg-slate-800 active:bg-slate-900 border border-slate-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-sm hover:shadow"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {label}
    </button>
  );
}

// 6. HelpButton (Used next to titles in all pages)
const helpPdfs = import.meta.glob("../assets/*.pdf", { eager: true, import: "default" });

const getPdfUrl = (pdfName) => {
  if (!pdfName) return null;
  const targetKey = `../assets/${pdfName}`.toLowerCase();
  for (const key of Object.keys(helpPdfs)) {
    if (key.toLowerCase() === targetKey) {
      return helpPdfs[key];
    }
  }
  return null;
};

export function HelpButton({ title, pdfName }) {
  const resolvedPdfName = pdfName || `${title.replace(/\s+/g, "")}_Help.pdf`;
  const pdfUrl = getPdfUrl(resolvedPdfName);

  const handleHelpClick = () => {
    if (!pdfUrl) {
      alert(`Help document for "${title}" is not available yet (expected file: ${resolvedPdfName}).`);
      return;
    }
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.setAttribute("download", resolvedPdfName);
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      type="button"
      className="p-1.5 rounded-full text-slate-400 hover:text-slate-650 hover:bg-slate-100 active:scale-95 transition-all inline-flex items-center justify-center cursor-pointer"
      onClick={handleHelpClick}
      title={`${title} Help`}
      aria-label={`${title} Help`}
    >
      <svg
        className="h-5 w-5"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </button>
  );
}

