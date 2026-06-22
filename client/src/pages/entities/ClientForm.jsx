import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import "../../styles/MasterPage.css";
import "../../styles/AdvocateForm.css";

const EMPTY_FORM = {
  name: "",
  clientTypeId: "",
  address: "",
  city: "",
  state: "",
  Pincode: "",
  contactNumber: "",
  alternateContactNumber: "",
  emailId: "",
  panNumber: "",
  gstNumber: "",
  aadhaarNumber: "",
  contactPerson: "",
};

function toInputValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function isIndividualType(typeName) {
  return typeName?.trim().toLowerCase() === "individual";
}

function digitsOnly(value, maxLength) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!maxLength) return digits;
  return digits.slice(0, maxLength);
}

function uppercaseValue(value) {
  return String(value ?? "").toUpperCase();
}

function ClientForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [clientTypes, setClientTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedClientType = useMemo(
    () => clientTypes.find((t) => String(t.id) === String(form.clientTypeId)),
    [clientTypes, form.clientTypeId],
  );

  const showAadhaar = isIndividualType(selectedClientType?.name);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const typesRes = await api.get("/masters/client-types");
        if (cancelled) return;
        setClientTypes(typesRes.data);

        if (isEdit) {
          const { data } = await api.get(`/clients/${id}`);
          if (cancelled) return;
          setForm({
            name: data.name || "",
            clientTypeId:
              data.clientTypeId != null ? String(data.clientTypeId) : "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            Pincode: toInputValue(data.Pincode),
            contactNumber: toInputValue(data.contactNumber),
            alternateContactNumber: toInputValue(data.alternateContactNumber),
            emailId: data.emailId || "",
            panNumber: data.panNumber || "",
            gstNumber: data.gstNumber || "",
            aadhaarNumber: data.aadhaarNumber || "",
            contactPerson: data.contactPerson || "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            (isEdit
              ? "Failed to load client."
              : "Failed to load client types."),
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

  const updateGstField = (e) => {
    const val = String(e.target.value ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 15);
    setForm((f) => ({
      ...f,
      gstNumber: val,
    }));
  };

  const handleClientTypeChange = (e) => {
    const clientTypeId = e.target.value;
    const type = clientTypes.find((t) => String(t.id) === clientTypeId);
    const individual = isIndividualType(type?.name);

    setForm((f) => ({
      ...f,
      clientTypeId,
      gstNumber: individual ? "" : f.gstNumber,
      aadhaarNumber: individual ? f.aadhaarNumber : "",
    }));
  };

  const handleCancel = () => {
    navigate("/client");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Client name is required.");
      return;
    }
    if (!form.clientTypeId) {
      setError("Client type is required.");
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
    if (!form.contactPerson.trim()) {
      setError("Contact person name is required.");
      return;
    }
    if (form.contactPerson.length > 50) {
      setError("Contact person name must not exceed 50 characters.");
      return;
    }
    const panRegex = /^[A-Za-z]{5}\d{4}[A-Za-z]{1}$/;
    if (!form.panNumber || !panRegex.test(form.panNumber)) {
      setError("PAN number must be 5 alphabets, 4 digits, and 1 alphabet (e.g. ABCDE1234F).");
      return;
    }
    if (showAadhaar) {
      if (!form.aadhaarNumber || form.aadhaarNumber.length !== 12) {
        setError("Aadhaar number must be exactly 12 digits.");
        return;
      }
    } else {
      const gstRegex = /^[A-Za-z0-9]{15}$/;
      if (!form.gstNumber || !gstRegex.test(form.gstNumber)) {
        setError("GST number must be exactly 15 alphanumeric characters.");
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      clientTypeId: Number(form.clientTypeId),
      address: form.address,
      city: form.city,
      state: form.state,
      Pincode: form.Pincode,
      contactNumber: form.contactNumber,
      alternateContactNumber: form.alternateContactNumber,
      emailId: form.emailId,
      panNumber: uppercaseValue(form.panNumber),
      gstNumber: showAadhaar ? "" : uppercaseValue(form.gstNumber),
      aadhaarNumber: showAadhaar ? form.aadhaarNumber : "",
      contactPerson: form.contactPerson.trim(),
    };

    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await api.put(`/clients/${id}`, payload);
      } else {
        await api.post("/clients", payload);
      }
      navigate("/client");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (isEdit ? "Failed to update client." : "Failed to create client."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="advocate-form-page">
        <h1 className="advocate-form-title">
          {isEdit ? "Update Client" : "Create Client"}
        </h1>
        <p className="master-empty">Loading…</p>
      </div>
    );
  }

  return (
    <div className="advocate-form-page">
      <h1 className="advocate-form-title">
        {isEdit ? "Update Client" : "Create Client"}
      </h1>

      {error && (
        <p className="master-error" role="alert">
          {error}
        </p>
      )}

      <form className="advocate-form" onSubmit={handleSubmit}>
        <div className="advocate-form-row">
          <label htmlFor="client-name">Client Name</label>
          <input
            id="client-name"
            type="text"
            value={form.name}
            onChange={updateField("name")}
            required
            autoFocus
          />
        </div>

        <div className="advocate-form-row">
          <label htmlFor="client-type">Client Type</label>
          <select
            id="client-type"
            value={form.clientTypeId}
            onChange={handleClientTypeChange}
            required
          >
            <option value="">Select client type</option>
            {clientTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className="advocate-form-row advocate-form-row-wide">
          <label htmlFor="client-address">Address</label>
          <textarea
            id="client-address"
            value={form.address}
            onChange={updateField("address")}
            required
          />
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="client-city">City</label>
          <input
            id="client-city"
            type="text"
            value={form.city}
            onChange={updateField("city")}
            required
          />
          <label htmlFor="client-state">State</label>
          <input
            id="client-state"
            type="text"
            value={form.state}
            onChange={updateField("state")}
            required
          />
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="client-Pincode">Pincode</label>
          <input
            id="client-Pincode"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={form.Pincode}
            onChange={updateNumericField("Pincode", 6)}
            required
          />
        </div>

        <div className="advocate-form-row advocate-form-row-wide">
          <label htmlFor="client-contact-person">Contact Person Name</label>
          <input
            id="client-contact-person"
            type="text"
            maxLength={50}
            value={form.contactPerson}
            onChange={updateField("contactPerson")}
            required
          />
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="client-contact">Contact No</label>
          <input
            id="client-contact"
            type="text"
            inputMode="tel"
            maxLength={10}
            value={form.contactNumber}
            onChange={updateNumericField("contactNumber", 10)}
            required
          />
          <label htmlFor="client-alt-contact">Alternate Contact No :</label>
          <input
            id="client-alt-contact"
            type="text"
            inputMode="tel"
            maxLength={10}
            value={form.alternateContactNumber}
            onChange={updateNumericField("alternateContactNumber", 10)}
            required
          />
        </div>

        <div className="advocate-form-row advocate-form-row-wide">
          <label htmlFor="client-email">Email Id</label>
          <input
            id="client-email"
            type="email"
            value={form.emailId}
            onChange={updateField("emailId")}
            required
          />
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="client-pan">PAN No</label>
          <input
            id="client-pan"
            type="text"
            maxLength={10}
            value={form.panNumber}
            onChange={updateUppercaseField("panNumber")}
            required
          />
          {showAadhaar ? (
            <>
              <label htmlFor="client-aadhaar">Aadhar No</label>
              <input
                id="client-aadhaar"
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={form.aadhaarNumber}
                onChange={updateNumericField("aadhaarNumber", 12)}
                required
              />
            </>
          ) : (
            <>
              <label htmlFor="client-gst">GST No</label>
              <input
                id="client-gst"
                type="text"
                maxLength={15}
                value={form.gstNumber}
                onChange={updateGstField}
                required
              />
            </>
          )}
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
          ALL FIELDS ARE MANDATORY<sup>*</sup>
        </div>
      </form>
    </div>
  );
}

export default ClientForm;
