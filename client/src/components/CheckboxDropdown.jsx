import { useEffect, useState, useRef } from "react";

/**
 * CheckboxDropdown Component
 * A custom select dropdown that allows selecting multiple options via checkboxes.
 *
 * @param {string} id - HTML ID for the trigger button.
 * @param {Array} options - List of select options: [{ id, name }]
 * @param {Array} selectedIds - List of currently selected IDs: [id1, id2]
 * @param {Function} onChange - Callback triggered when selection changes: (newIds) => void
 * @param {string} placeholder - Default trigger text when no option is selected.
 */
export function CheckboxDropdown({
  id,
  options = [],
  selectedIds = [],
  onChange,
  placeholder = "Select options",
  autoFocus = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const selectedNames = options
    .filter((opt) => selectedIds.includes(opt.id))
    .map((opt) => opt.name)
    .join(", ");

  const handleCheckboxChange = (optionId) => {
    if (selectedIds.includes(optionId)) {
      onChange(selectedIds.filter((id) => id !== optionId));
    } else {
      onChange([...selectedIds, optionId]);
    }
  };

  return (
    <div ref={dropdownRef} className="custom-checkbox-dropdown">
      <button
        id={id}
        type="button"
        className="dropdown-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        autoFocus={autoFocus}
      >
        <span style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          marginRight: "0.5rem",
          flex: 1,
          textAlign: "left"
        }}>
          {selectedNames || placeholder}
        </span>
        <span className="dropdown-arrow">▼</span>
      </button>
      {isOpen && (
        <div className="dropdown-options-list">
          {options.map((opt) => {
            const isChecked = selectedIds.includes(opt.id);
            return (
              <label key={opt.id} className="dropdown-option-item">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCheckboxChange(opt.id)}
                />
                <span className="option-label-text">{opt.name}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CheckboxDropdown;
