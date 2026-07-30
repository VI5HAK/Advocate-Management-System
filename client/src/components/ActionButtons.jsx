import React from "react";

// 1. CreateButton (Used on listing headers to open a create form)
export function CreateButton({ onClick, label = "Create", disabled, ...props }) {
  return (
    <button
      type="button"
      className="master-btn btn-create"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      <span className="btn-text">{label}</span>
      <svg className="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
      className="master-btn master-btn-sm btn-update"
      onClick={onClick}
      disabled={disabled}
      title={label}
      {...props}
    >
      {children ? children : (
        <>
          <span className="btn-text">{label}</span>
          <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
      className="master-btn master-btn-sm btn-delete"
      onClick={onClick}
      disabled={disabled}
      title={label}
      {...props}
    >
      <span className="btn-text">{label}</span>
      <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
      className={`master-btn ${isEdit ? "btn-update" : "btn-create"}`}
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
      className="master-btn master-btn-outline"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {label}
    </button>
  );
}
