import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import { CascadingLocationDropdown } from "../../components/CascadingLocationDropdown";
import { SubmitButton, CancelButton } from "../../components/ActionButtons";
import "../../styles/MasterPage.css";
import "../../styles/AdvocateForm.css";
import { useForm } from "../../hooks/useForm";
import {
  getClientSchema,
  digitsOnly,
  uppercaseAlphaAndSpaces,
  uppercaseAlphaNum,
} from "../../utils/validation";

const EMPTY_FORM = {
  name: "",
  clientTypeId: "",
  stateCode: "",
  districtCode: "",
  talukCode: "",
  address: "",
  Pincode: "",
  contactNumber: "",
  alternateContactNumber: "",
  emailId: "",
  panNumber: "",
  gstNumber: "",
  aadhaarNumber: "",
  contactPerson: "",
};

function isIndividualType(typeName) {
  return typeName?.trim().toLowerCase() === "individual";
}

function ClientForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [clientTypes, setClientTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (formValues) => {
    const selectedType = clientTypes.find((t) => String(t.id) === String(formValues.clientTypeId));
    const showAadhaar = isIndividualType(selectedType?.name);

    const payload = {
      name: formValues.name.trim(),
      clientTypeId: Number(formValues.clientTypeId),
      stateCode: Number(formValues.stateCode),
      districtCode: Number(formValues.districtCode),
      talukCode: Number(formValues.talukCode),
      address: formValues.address.trim(),
      Pincode: formValues.Pincode,
      contactNumber: formValues.contactNumber,
      alternateContactNumber: formValues.alternateContactNumber,
      emailId: formValues.emailId.trim(),
      panNumber: formValues.panNumber,
      gstNumber: showAadhaar ? "" : formValues.gstNumber,
      aadhaarNumber: showAadhaar ? formValues.aadhaarNumber : "",
      contactPerson: formValues.contactPerson.trim(),
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
    schema: () => {
      const selectedType = clientTypes.find((t) => String(t.id) === String(values.clientTypeId));
      const showAadhaar = isIndividualType(selectedType?.name);
      return getClientSchema(showAadhaar);
    },
    onSubmit: handleSave,
  });

  // Calculate dynamic states based on values.clientTypeId for UI toggles
  const selectedClientType = useMemo(
    () => clientTypes.find((t) => String(t.id) === String(values.clientTypeId)),
    [clientTypes, values.clientTypeId],
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
          setValues({
            name: data.name || "",
            clientTypeId: data.clientTypeId != null ? String(data.clientTypeId) : "",
            stateCode: data.stateCode != null ? String(data.stateCode) : "",
            districtCode: data.districtCode != null ? String(data.districtCode) : "",
            talukCode: data.talukCode != null ? String(data.talukCode) : "",
            address: data.address || "",
            Pincode: String(data.Pincode ?? ""),
            contactNumber: String(data.contactNumber ?? ""),
            alternateContactNumber: String(data.alternateContactNumber ?? ""),
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
            (isEdit ? "Failed to load client." : "Failed to load client types."),
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
    navigate("/client");
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
          <div className="form-input-wrapper">
            <input
              id="client-name"
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
          <label htmlFor="client-type">Client Type</label>
          <div className="form-input-wrapper">
            <select
              id="client-type"
              className={errors.clientTypeId ? "input-has-error" : ""}
              {...register("clientTypeId")}
              onChange={(e) => {
                const val = e.target.value;
                const type = clientTypes.find((t) => String(t.id) === val);
                const individual = isIndividualType(type?.name);
                setValue("clientTypeId", val);
                setValue("gstNumber", individual ? "" : values.gstNumber);
                setValue("aadhaarNumber", individual ? values.aadhaarNumber : "");
              }}
              required
            >
              <option value="">Select client type</option>
              {clientTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.clientTypeId && <span className="field-error">{errors.clientTypeId}</span>}
          </div>
        </div>

        <CascadingLocationDropdown
          stateCode={values.stateCode}
          districtCode={values.districtCode}
          talukCode={values.talukCode}
          onChange={(loc) => {
            setValue("stateCode", loc.stateCode ? String(loc.stateCode) : "");
            setValue("districtCode", loc.districtCode ? String(loc.districtCode) : "");
            setValue("talukCode", loc.talukCode ? String(loc.talukCode) : "");
          }}
          errors={errors}
          required
        />

        <div className="advocate-form-row advocate-form-row-wide">
          <label htmlFor="client-address">Address</label>
          <div className="form-input-wrapper">
            <textarea
              id="client-address"
              className={errors.address ? "input-has-error" : ""}
              maxLength={200}
              {...register("address", { transform: (v) => v.slice(0, 200) })}
              required
            />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </div>
        </div>

        <div className="advocate-form-row">
          <label htmlFor="client-Pincode">Pincode</label>
          <div className="form-input-wrapper">
            <input
              id="client-Pincode"
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

        <div className="advocate-form-row advocate-form-row-wide">
          <label htmlFor="client-contact-person">Contact Person Name</label>
          <div className="form-input-wrapper">
            <input
              id="client-contact-person"
              type="text"
              className={errors.contactPerson ? "input-has-error" : ""}
              {...register("contactPerson", { transform: (v) => v.slice(0, 50) })}
              required
            />
            {errors.contactPerson && <span className="field-error">{errors.contactPerson}</span>}
          </div>
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="client-contact">Contact No</label>
          <div className="form-input-wrapper">
            <input
              id="client-contact"
              type="text"
              inputMode="tel"
              maxLength={10}
              className={errors.contactNumber ? "input-has-error" : ""}
              {...register("contactNumber", { transform: (v) => digitsOnly(v, 10) })}
              required
            />
            {errors.contactNumber && <span className="field-error">{errors.contactNumber}</span>}
          </div>
          <label htmlFor="client-alt-contact">Alternate Contact No :</label>
          <div className="form-input-wrapper">
            <input
              id="client-alt-contact"
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
          <label htmlFor="client-email">Email Id</label>
          <div className="form-input-wrapper">
            <input
              id="client-email"
              type="email"
              className={errors.emailId ? "input-has-error" : ""}
              {...register("emailId")}
            />
            {errors.emailId && <span className="field-error">{errors.emailId}</span>}
          </div>
        </div>

        <div className="advocate-form-row advocate-form-row-pair">
          <label htmlFor="client-pan">PAN No</label>
          <div className="form-input-wrapper">
            <input
              id="client-pan"
              type="text"
              maxLength={10}
              className={errors.panNumber ? "input-has-error" : ""}
              {...register("panNumber", { transform: (v) => uppercaseAlphaNum(v, 10) })}
            />
            {errors.panNumber && <span className="field-error">{errors.panNumber}</span>}
          </div>
          {showAadhaar ? (
            <>
              <label htmlFor="client-aadhaar">Aadhar No</label>
              <div className="form-input-wrapper">
                <input
                  id="client-aadhaar"
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  className={errors.aadhaarNumber ? "input-has-error" : ""}
                  {...register("aadhaarNumber", { transform: (v) => digitsOnly(v, 12) })}
                />
                {errors.aadhaarNumber && <span className="field-error">{errors.aadhaarNumber}</span>}
              </div>
            </>
          ) : (
            <>
              <label htmlFor="client-gst">GST No</label>
              <div className="form-input-wrapper">
                <input
                  id="client-gst"
                  type="text"
                  maxLength={15}
                  className={errors.gstNumber ? "input-has-error" : ""}
                  {...register("gstNumber", { transform: (v) => uppercaseAlphaNum(v, 15) })}
                />
                {errors.gstNumber && <span className="field-error">{errors.gstNumber}</span>}
              </div>
            </>
          )}
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

export default ClientForm;
