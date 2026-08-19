import { useEffect, useState, useRef } from "react";
import dayjs from "../utils/datePicker";

/**
 * Reusable CustomDatePicker component.
 * Displays a text input formatted as DD/MM/YYYY which synchronizes with
 * an underlying native HTML5 date input (using ISO format YYYY-MM-DD).
 */
export function CustomDatePicker({ id, value, onChange, min, max, required, disabled, className }) {
  const dateInputRef = useRef(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (value) {
      // value is in YYYY-MM-DD. We format it to DD/MM/YYYY.
      const formatted = dayjs(value).format("DD/MM/YYYY");
      setInputValue(formatted);
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleClick = () => {
    if (disabled) return;
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch (err) {
        dateInputRef.current.focus();
      }
    }
  };

  const handleInputChange = (e) => {
    let val = e.target.value;

    // Automatically insert slashes as user types
    if (val.length > inputValue.length) {
      if (val.length === 2 || val.length === 5) {
        val += "/";
      }
    }

    // Limit to 10 characters (DD/MM/YYYY)
    if (val.length <= 10) {
      setInputValue(val);
    }

    const dmyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (val.match(dmyPattern)) {
      const parsed = dayjs(val);
      if (parsed.isValid()) {
        const isoDate = parsed.format("YYYY-MM-DD");
        // Check max bounds if specified
        if (max && isoDate > max) {
          return;
        }
        onChange({ target: { value: isoDate } });
      }
    } else if (val === "") {
      onChange({ target: { value: "" } });
    }
  };

  const handleBlur = () => {
    const dmyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (inputValue && !inputValue.match(dmyPattern)) {
      if (value) {
        setInputValue(dayjs(value).format("DD/MM/YYYY"));
      } else {
        setInputValue("");
      }
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
      <input
        type="text"
        className={className || "master-input-text"}
        value={inputValue}
        placeholder="DD/MM/YYYY"
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={disabled}
        style={className ? { paddingRight: "2.5rem" } : {
          width: "100%",
          height: "3rem",
          padding: "0 2.5rem 0 0.75rem",
          border: "1px solid #9ca3af",
          borderRadius: "6px",
          boxSizing: "border-box",
          background: disabled ? "#f3f4f6" : "#fff",
          fontSize: "1.05rem"
        }}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        style={{
          position: "absolute",
          right: "0.75rem",
          background: "transparent",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: "1.2rem",
          display: "flex",
          alignItems: "center",
          color: "#6b7280"
        }}
      >
        📅
      </button>
      <input
        id={id}
        ref={dateInputRef}
        type="date"
        min={min}
        max={max}
        value={value || ""}
        onChange={onChange}
        required={required}
        disabled={disabled}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: "none"
        }}
      />
    </div>
  );
}

export default CustomDatePicker;
