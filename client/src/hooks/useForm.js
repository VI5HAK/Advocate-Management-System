import { useState } from "react";

/**
 * A custom hook to manage React form state, validation (via Zod), and input transformations.
 * 
 * @param {Object} initialValues - The initial state of the form fields.
 * @param {ZodSchema} schema - Zod validation schema.
 * @param {Function} onSubmit - Form submit handler callback.
 */
export function useForm({ initialValues, schema, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = (name) => {
    if (!schema) return;
    const result = schema.safeParse(values);
    if (!result.success) {
      // Find if there is an error for this field
      const fieldError = result.error.issues.find((err) => err.path.includes(name));
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [name]: fieldError.message }));
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    if (!schema) return true;
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return true;
    }

    const nextErrors = {};
    result.error.issues.forEach((err) => {
      // Use the first path segment (or dot-joined path) as key
      const key = err.path[0] || "form";
      if (!nextErrors[key]) {
        nextErrors[key] = err.message;
      }
    });
    setErrors(nextErrors);
    return false;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const register = (name, options = {}) => {
    return {
      name,
      value: values[name] !== undefined && values[name] !== null ? String(values[name]) : "",
      onChange: (e) => {
        let val = e.target.value;
        if (options.transform) {
          val = options.transform(val);
        }
        setValue(name, val);
      },
      onBlur: () => handleBlur(name),
    };
  };

  return {
    values,
    errors,
    setErrors,
    setValues,
    isSubmitting,
    setValue,
    validate,
    handleSubmit,
    register,
  };
}

export default useForm;
