import DatePicker from "./ui/date-picker";

/**
 * Reusable CustomDatePicker component.
 * Wraps DatePicker UI component and passes a synthetic event target object for compatibility.
 */
export function CustomDatePicker({ id, value, onChange, min, max, required, disabled, className, placeholder }) {
  const handleChange = (val) => {
    if (typeof onChange === "function") {
      onChange({ target: { value: val } });
    }
  };

  return (
    <DatePicker
      id={id}
      value={value}
      onChange={handleChange}
      min={min}
      max={max}
      required={required}
      disabled={disabled}
      className={className}
      placeholder={placeholder}
    />
  );
}

export default CustomDatePicker;

