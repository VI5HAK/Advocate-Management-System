import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import { CascadingLocationDropdown } from "../../components/CascadingLocationDropdown";
import { SubmitButton, CancelButton } from "../../components/ActionButtons";
import "../../styles/MasterPage.css";
import "../../styles/AdvocateForm.css";
import { useForm } from "../../hooks/useForm";
import {
  createAdvocateSchema,
  updateAdvocateSchema,
  digitsOnly,
  uppercaseAlphaAndSpaces,
  uppercaseAlphaNum,
} from "../../utils/validation";

const EMPTY_FORM = {
  name: "",
  roleId: "",
  State_ID: "",
  District_ID: "",
  Taluk_ID: "",
  address: "",
  Pincode: "",
  contactNumber: "",
  alternateContactNumber: "",
  emailId: "",
  password: "",
  confirmPassword: "",
  panNumber: "",
  aadhaarNumber: "",
};

function AdvocateForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const schema = isEdit ? updateAdvocateSchema : createAdvocateSchema;

  const handleSave = async (formValues) => {
    const payload = {
      name: formValues.name.trim(),
      roleId: Number(formValues.roleId),
      State_ID: Number(formValues.State_ID),
      District_ID: Number(formValues.District_ID),
      Taluk_ID: Number(formValues.Taluk_ID),
      address: formValues.address.trim(),
      Pincode: formValues.Pincode,
      contactNumber: formValues.contactNumber,
      alternateContactNumber: formValues.alternateContactNumber,
      emailId: formValues.emailId.trim(),
      panNumber: formValues.panNumber,
      aadhaarNumber: formValues.aadhaarNumber,
    };

    if (!isEdit || formValues.password) {
      payload.password = formValues.password;
      payload.confirmPassword = formValues.confirmPassword;
    }

    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await api.put(`/advocates/${id}`, payload);
      } else {
        await api.post("/advocates", payload);
      }
      navigate("/advocate");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (isEdit ? "Failed to update advocate." : "Failed to create advocate."),
      );
    } finally {
      setSaving(false);
    }
  };

  const {
    values,
    errors,
    setValues,
    isSubmitting,
    handleSubmit,
    register,
    setValue,
  } = useForm({
    initialValues: EMPTY_FORM,
    schema,
    onSubmit: handleSave,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const rolesRes = await api.get("/masters/roles");
        if (cancelled) return;
        setRoles(rolesRes.data);

        if (isEdit) {
          const { data } = await api.get(`/advocates/${id}`);
          if (cancelled) return;
          setValues({
            name: data.name || "",
            roleId: data.roleId != null ? String(data.roleId) : "",
            State_ID: data.State_ID != null ? String(data.State_ID) : "",
            District_ID: data.District_ID != null ? String(data.District_ID) : "",
            Taluk_ID: data.Taluk_ID != null ? String(data.Taluk_ID) : "",
            address: data.address || "",
            Pincode: String(data.Pincode ?? ""),
            contactNumber: String(data.contactNumber ?? ""),
            alternateContactNumber: String(data.alternateContactNumber ?? ""),
            emailId: data.emailId || "",
            panNumber: data.panNumber || "",
            aadhaarNumber: data.aadhaarNumber || "",
            password: "",
            confirmPassword: "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            (isEdit ? "Failed to load advocate." : "Failed to load roles."),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, setValues]);

  const handleCancel = () => {
    navigate("/advocate");
  };

  if (loading) {
    return (
      <div className="advocate-form-page">
        <h1 className="advocate-form-title">
          {isEdit ? "Update Advocate" : "Create Advocate"}
        </h1>
        <p className="master-empty">Loading…</p>
      </div>
    );
  }

  return (
    <div className="advocate-form-page">
      <h1 className="advocate-form-title">
        {isEdit ? "Update Advocate" : "Create Advocate"}
      </h1>

      {error && (
        <p className="master-error" role="alert">
          {error}
        </p>
      )}

      <form className="advocate-form" onSubmit={handleSubmit}>
        <div className="advocate-form-row">
          <label htmlFor="advocate-name">Name</label>
          <div className="form-input-wrapper">
            <input
              id="advocate-name"
              type="text"
              className={errors.name ? "input-has-error" : ""}
              {...register("name", { transform: (v) => uppercaseAlphaAndSpaces(v, 49) })}
              required
              autoFocus
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="advocate-role">Role</label>
          <div className="form-input-wrapper">
            <select
              id="advocate-role"
              className={errors.roleId ? "input-has-error" : ""}
              {...register("roleId")}
              required
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.roleId && <span className="field-error">{errors.roleId}</span>}
          </div>
        </div>

        <CascadingLocationDropdown
          State_ID={values.State_ID}
          District_ID={values.District_ID}
          Taluk_ID={values.Taluk_ID}
          onChange={(loc) => {
            setValue("State_ID", loc.State_ID ? String(loc.State_ID) : "");
            setValue("District_ID", loc.District_ID ? String(loc.District_ID) : "");
            setValue("Taluk_ID", loc.Taluk_ID ? String(loc.Taluk_ID) : "");
          }}
          errors={errors}
          required
        />

        <div className="advocate-form-row advocate-form-row-wide">
          <label htmlFor="advocate-address">Address</label>
          <div className="form-input-wrapper">
            <textarea
              id="advocate-address"
              className={errors.address ? "input-has-error" : ""}
              maxLength={200}
              {...register("address", { transform: (v) => v.slice(0, 200) })}
              required
            />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </div>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="advocate-Pincode">Pincode</label>
          <div className="form-input-wrapper">
            <input
              id="advocate-Pincode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              className={errors.Pincode ? "input-has-error" : ""}
              {...register("Pincode", { transform: (v) => digitsOnly(v, 6) })}
              required
            />
            {errors.Pincode && <span className="field-error">{errors.Pincode}</span>}
          </div>
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="advocate-contact">Contact No</label>
          <div className="form-input-wrapper">
            <input
              id="advocate-contact"
              type="text"
              inputMode="tel"
              maxLength={10}
              className={errors.contactNumber ? "input-has-error" : ""}
              {...register("contactNumber", { transform: (v) => digitsOnly(v, 10) })}
              required
            />
            {errors.contactNumber && <span className="field-error">{errors.contactNumber}</span>}
          </div>
          <label htmlFor="advocate-alt-contact">Alternate Contact No :</label>
          <div className="form-input-wrapper">
            <input
              id="advocate-alt-contact"
              type="text"
              inputMode="tel"
              maxLength={10}
              className={errors.alternateContactNumber ? "input-has-error" : ""}
              {...register("alternateContactNumber", { transform: (v) => digitsOnly(v, 10) })}
              required
            />
            {errors.alternateContactNumber && <span className="field-error">{errors.alternateContactNumber}</span>}
          </div>
        </div>

        <div className="advocate-form-row advocate-form-row-wide">
          <label htmlFor="advocate-email">Email Id</label>
          <div className="form-input-wrapper">
            <input
              id="advocate-email"
              type="email"
              className={errors.emailId ? "input-has-error" : ""}
              {...register("emailId")}
              required
            />
            {errors.emailId && <span className="field-error">{errors.emailId}</span>}
          </div>
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="advocate-password">Password</label>
          <div className="form-input-wrapper">
            <div className="password-input-container">
              <input
                id="advocate-password"
                type={showPassword ? "text" : "password"}
                className={errors.password ? "input-has-error" : ""}
                {...register("password")}
                required={!isEdit}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <label htmlFor="advocate-confirm-password">Confirm Password</label>
          <div className="form-input-wrapper">
            <div className="password-input-container">
              <input
                id="advocate-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                className={errors.confirmPassword ? "input-has-error" : ""}
                {...register("confirmPassword")}
                required={!isEdit}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="advocate-pan">PAN No</label>
          <div className="form-input-wrapper">
            <input
              id="advocate-pan"
              type="text"
              maxLength={10}
              className={errors.panNumber ? "input-has-error" : ""}
              {...register("panNumber", { transform: (v) => uppercaseAlphaNum(v, 10) })}
              required
            />
            {errors.panNumber && <span className="field-error">{errors.panNumber}</span>}
          </div>
          <label htmlFor="advocate-aadhaar">Aadhar No</label>
          <div className="form-input-wrapper">
            <input
              id="advocate-aadhaar"
              type="text"
              inputMode="numeric"
              maxLength={12}
              className={errors.aadhaarNumber ? "input-has-error" : ""}
              {...register("aadhaarNumber", { transform: (v) => digitsOnly(v, 12) })}
              required
            />
            {errors.aadhaarNumber && <span className="field-error">{errors.aadhaarNumber}</span>}
          </div>
        </div>

        <div className="advocate-form-actions">
          <SubmitButton isEdit={isEdit} saving={saving || isSubmitting} />
          <CancelButton onClick={handleCancel} disabled={saving || isSubmitting} />
        </div>
        <div className="form-mandatory-hint">
          ALL FIELDS ARE MANDATORY<sup>*</sup>
        </div>
      </form>
    </div>
  );
}

export default AdvocateForm;
