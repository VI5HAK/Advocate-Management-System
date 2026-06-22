import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import "../../styles/MasterPage.css";
import "../../styles/AdvocateForm.css";

const EMPTY_FORM = {
  name: "",
  roleId: "",
  address: "",
  city: "",
  state: "",
  Pincode: "",
  contactNumber: "",
  alternateContactNumber: "",
  emailId: "",
  password: "",
  confirmPassword: "",
  panNumber: "",
  aadhaarNumber: "",
};

function toInputValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function digitsOnly(value, maxLength) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!maxLength) return digits;
  return digits.slice(0, maxLength);
}

function uppercaseValue(value) {
  return String(value ?? "").toUpperCase();
}

function AdvocateForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
          setForm({
            name: data.name || "",
            roleId: data.roleId != null ? String(data.roleId) : "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            Pincode: toInputValue(data.Pincode),
            contactNumber: toInputValue(data.contactNumber),
            alternateContactNumber: toInputValue(data.alternateContactNumber),
            emailId: data.emailId || "",
            panNumber: data.panNumber || "",
            aadhaarNumber: data.aadhaarNumber || "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            (isEdit
              ? "Failed to load advocate."
              : "Failed to load roles."),
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
  }, [id, isEdit]);

  const updateField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const updateNumericField = (field, maxLength) => (e) => {
    setForm((f) => ({
      ...f,
      [field]: digitsOnly(e.target.value, maxLength),
    }));
  };

  const updateUppercaseField = (field) => (e) => {
    setForm((f) => ({
      ...f,
      [field]: uppercaseValue(e.target.value),
    }));
  };

  const handleCancel = () => {
    navigate("/advocate");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.roleId) {
      setError("Role is required.");
      return;
    }
    if (!form.address.trim()) {
      setError("Address is required.");
      return;
    }
    if (!form.city.trim()) {
      setError("City is required.");
      return;
    }
    if (!form.state.trim()) {
      setError("State is required.");
      return;
    }
    if (!form.Pincode || form.Pincode.length !== 6) {
      setError("Pincode must be exactly 6 digits.");
      return;
    }
    if (!form.contactNumber || form.contactNumber.length !== 10) {
      setError("Contact number must be exactly 10 digits.");
      return;
    }
    if (!form.alternateContactNumber || form.alternateContactNumber.length !== 10) {
      setError("Alternate contact number must be exactly 10 digits.");
      return;
    }
    if (!form.emailId.trim()) {
      setError("Email is required.");
      return;
    }
    if (!form.password || !form.confirmPassword) {
      setError("Password and confirm password are required.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }
    const panRegex = /^[A-Za-z]{5}\d{4}[A-Za-z]{1}$/;
    if (!form.panNumber || !panRegex.test(form.panNumber)) {
      setError("PAN number must be 5 alphabets, 4 digits, and 1 alphabet (e.g. ABCDE1234F).");
      return;
    }
    if (!form.aadhaarNumber || form.aadhaarNumber.length !== 12) {
      setError("Aadhaar number must be exactly 12 digits.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      roleId: Number(form.roleId),
      address: form.address,
      city: form.city,
      state: form.state,
      Pincode: form.Pincode,
      contactNumber: form.contactNumber,
      alternateContactNumber: form.alternateContactNumber,
      emailId: form.emailId,
      panNumber: uppercaseValue(form.panNumber),
      aadhaarNumber: form.aadhaarNumber,
    };

    if (!isEdit || form.password) {
      payload.password = form.password;
      payload.confirmPassword = form.confirmPassword;
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
          <input
            id="advocate-name"
            type="text"
            value={form.name}
            onChange={updateField("name")}
            required
            autoFocus
          />
        </div>

        <div className="advocate-form-row">
          <label htmlFor="advocate-role">Role</label>
          <select
            id="advocate-role"
            value={form.roleId}
            onChange={updateField("roleId")}
            required
          >
            <option value="">Select role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="advocate-form-row advocate-form-row-wide">
          <label htmlFor="advocate-address">Address</label>
          <textarea
            id="advocate-address"
            value={form.address}
            onChange={updateField("address")}
            required
          />
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="advocate-city">City</label>
          <input
            id="advocate-city"
            type="text"
            value={form.city}
            onChange={updateField("city")}
            required
          />
          <label htmlFor="advocate-state">State</label>
          <input
            id="advocate-state"
            type="text"
            value={form.state}
            onChange={updateField("state")}
            required
          />
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="advocate-Pincode">Pincode</label>
          <input
            id="advocate-Pincode"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={form.Pincode}
            onChange={updateNumericField("Pincode", 6)}
            required
          />
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="advocate-contact">Contact No</label>
          <input
            id="advocate-contact"
            type="text"
            inputMode="tel"
            maxLength={10}
            value={form.contactNumber}
            onChange={updateNumericField("contactNumber", 10)}
            required
          />
          <label htmlFor="advocate-alt-contact">Alternate Contact No :</label>
          <input
            id="advocate-alt-contact"
            type="text"
            inputMode="tel"
            maxLength={10}
            value={form.alternateContactNumber}
            onChange={updateNumericField("alternateContactNumber", 10)}
            required
          />
        </div>

        <div className="advocate-form-row advocate-form-row-wide">
          <label htmlFor="advocate-email">Email Id</label>
          <input
            id="advocate-email"
            type="email"
            value={form.emailId}
            onChange={updateField("emailId")}
            required
          />
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="advocate-password">Password</label>
          <div className="password-input-container">
            <input
              id="advocate-password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={updateField("password")}
              required
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
          <label htmlFor="advocate-confirm-password">Confirm Password</label>
          <div className="password-input-container">
            <input
              id="advocate-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={updateField("confirmPassword")}
              required
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
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="advocate-pan">PAN No</label>
          <input
            id="advocate-pan"
            type="text"
            maxLength={10}
            value={form.panNumber}
            onChange={updateUppercaseField("panNumber")}
            required
          />
          <label htmlFor="advocate-aadhaar">Aadhar No</label>
          <input
            id="advocate-aadhaar"
            type="text"
            inputMode="numeric"
            maxLength={12}
            value={form.aadhaarNumber}
            onChange={updateNumericField("aadhaarNumber", 12)}
            required
          />
        </div>

        <div className="advocate-form-actions">
          <button type="submit" className={`master-btn ${isEdit ? "btn-update" : "btn-create"}`} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update" : "Submit"}
          </button>
          <button
            type="button"
            className="master-btn master-btn-outline"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
        <div className="form-mandatory-hint">
          ALL  FIELDS  ARE  MANDATORY<sup>*</sup>
        </div>
      </form>
    </div>
  );
}

export default AdvocateForm;
