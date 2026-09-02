import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import entityService from "../../api/services/entity.service";
import masterService from "../../api/services/master.service";
import { CascadingLocationDropdown } from "../../components/common/CascadingLocationDropdown";
import SearchableSelect from "../../components/common/SearchableSelect";
import { SubmitButton, CancelButton } from "../../components/common/ActionButtons";
import { useForm } from "../../hooks/useForm";
import { Users } from "lucide-react";
import ClientBasicInfoSection from "./components/client/ClientBasicInfoSection";
import ClientContactIdentitySection from "./components/client/ClientContactIdentitySection";
import {
  getClientSchema,
  digitsOnly,
  uppercaseAlphaAndSpaces,
  uppercaseAlphaNum,
} from "../../utils/validation";

const EMPTY_FORM = {
  name: "",
  clientTypeId: "",
  State_ID: "",
  District_ID: "",
  Taluk_ID: "",
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
      State_ID: Number(formValues.State_ID),
      District_ID: Number(formValues.District_ID),
      Taluk_ID: Number(formValues.Taluk_ID),
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
        await entityService.updateClient(id, payload);
      } else {
        await entityService.createClient(payload);
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
        const typesRes = await masterService.getMasterItems("/masters/client-types");
        if (cancelled) return;
        setClientTypes(typesRes.data);

        if (isEdit) {
          const { data } = await entityService.getClient(id);
          if (cancelled) return;
          setValues({
            name: data.name || "",
            clientTypeId: data.clientTypeId != null ? String(data.clientTypeId) : "",
            State_ID: data.State_ID != null ? String(data.State_ID) : "",
            District_ID: data.District_ID != null ? String(data.District_ID) : "",
            Taluk_ID: data.Taluk_ID != null ? String(data.Taluk_ID) : "",
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
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 animate-pulse">
        <header className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-7 w-7 shrink-0" />
            </div>
            {isEdit ? "Update Client" : "Create Client"}
          </h1>
        </header>
        <div className="py-8 text-center text-slate-400 font-medium">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
      <header className="border-b border-slate-100 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Users className="h-7 w-7 shrink-0" />
          </div>
          {isEdit ? "Update Client" : "Create Client"}
        </h1>
      </header>

      {error && (
        <div className="p-4 text-sm font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl" role="alert">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <ClientBasicInfoSection
          values={values}
          errors={errors}
          register={register}
          setValue={setValue}
          clientTypes={clientTypes}
          isIndividualType={isIndividualType}
        />

        <div className="space-y-1.5">
          <label htmlFor="client-address" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
          <div className="relative">
            <textarea
              id="client-address"
              className={`w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white resize-vertical min-h-[100px] ${
                errors.address
                  ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
              }`}
              maxLength={200}
              {...register("address", { transform: (v) => v.slice(0, 200) })}
              required
            />
            {errors.address && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.address}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
            rowClassName="space-y-1.5 [&>label]:block [&>label]:text-xs [&>label]:font-bold [&>label]:text-slate-500 [&>label]:uppercase [&>label]:tracking-wider"
            inputWrapperClassName="relative"
            selectClassName="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-50 focus:bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            required
          />
        </div>

        <ClientContactIdentitySection
          values={values}
          errors={errors}
          register={register}
          showAadhaar={showAadhaar}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <CancelButton onClick={handleCancel} disabled={saving || isSubmitting} />
          <SubmitButton isEdit={isEdit} saving={saving || isSubmitting} />
        </div>
        <div className="text-[10px] font-bold text-red-500 text-right mt-2 uppercase tracking-wider">
          * All fields are mandatory
        </div>
      </form>
    </div>
  );
}

export default ClientForm;
