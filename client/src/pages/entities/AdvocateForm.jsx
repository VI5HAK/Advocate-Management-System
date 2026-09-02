import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import entityService from "../../api/services/entity.service";
import masterService from "../../api/services/master.service";
import { CascadingLocationDropdown } from "../../components/common/CascadingLocationDropdown";
import SearchableSelect from "../../components/common/SearchableSelect";
import { SubmitButton, CancelButton } from "../../components/common/ActionButtons";
import { UserCheck } from "lucide-react";
import { useForm } from "../../hooks/useForm";
import AdvocatePasswordSection from "./components/advocate/AdvocatePasswordSection";
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
        await entityService.updateAdvocate(id, payload);
      } else {
        await entityService.createAdvocate(payload);
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
        const rolesRes = await masterService.getMasterItems("/masters/roles");
        if (cancelled) return;
        setRoles(rolesRes.data);

        if (isEdit) {
          const { data } = await entityService.getAdvocate(id);
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
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 animate-pulse">
        <header className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <UserCheck className="h-7 w-7 shrink-0" />
            </div>
            {isEdit ? "Update Advocate" : "Create Advocate"}
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
            <UserCheck className="h-7 w-7 shrink-0" />
          </div>
          {isEdit ? "Update Advocate" : "Create Advocate"}
        </h1>
      </header>

      {error && (
        <div className="p-4 text-sm font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl" role="alert">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label htmlFor="advocate-name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Name</label>
            <div className="relative">
              <input
                id="advocate-name"
                type="text"
                className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                  errors.name
                    ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
                }`}
                {...register("name", { transform: (v) => uppercaseAlphaAndSpaces(v, 49) })}
                required
                autoFocus
              />
              {errors.name && (
                <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                  {errors.name}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="advocate-role" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
              <SearchableSelect
                id="advocate-role"
                value={values.roleId}
                options={roles.map((role) => ({
                  value: String(role.id),
                  label: role.name,
                }))}
                onChange={(val) => setValue("roleId", val)}
                placeholder="Select role"
                searchPlaceholder="Search role..."
                emptyMessage="No roles found."
                className={
                  errors.roleId
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                    : ""
                }
              />
              {errors.roleId && (
                <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                  {errors.roleId}
                </span>
              )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="advocate-address" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
          <div className="relative">
            <textarea
              id="advocate-address"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5 col-span-1">
            <label htmlFor="advocate-Pincode" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Pincode</label>
            <div className="relative">
              <input
                id="advocate-Pincode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                  errors.Pincode
                    ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
                }`}
                {...register("Pincode", { transform: (v) => digitsOnly(v, 6) })}
                required
              />
              {errors.Pincode && (
                <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                  {errors.Pincode}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5 col-span-1 md:col-span-2">
            <label htmlFor="advocate-email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email Id</label>
            <div className="relative">
              <input
                id="advocate-email"
                type="email"
                className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                  errors.emailId
                    ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
                }`}
                {...register("emailId")}
                required
              />
              {errors.emailId && (
                <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                  {errors.emailId}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label htmlFor="advocate-contact" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Contact No</label>
            <div className="relative">
              <input
                id="advocate-contact"
                type="text"
                inputMode="tel"
                maxLength={10}
                className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                  errors.contactNumber
                    ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
                }`}
                {...register("contactNumber", { transform: (v) => digitsOnly(v, 10) })}
                required
              />
              {errors.contactNumber && (
                <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                  {errors.contactNumber}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="advocate-alt-contact" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Alternate Contact No</label>
            <div className="relative">
              <input
                id="advocate-alt-contact"
                type="text"
                inputMode="tel"
                maxLength={10}
                className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                  errors.alternateContactNumber
                    ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
                }`}
                {...register("alternateContactNumber", { transform: (v) => digitsOnly(v, 10) })}
                required
              />
              {errors.alternateContactNumber && (
                <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                  {errors.alternateContactNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        <AdvocatePasswordSection
          isEdit={isEdit}
          errors={errors}
          register={register}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-105 border-slate-100">
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

export default AdvocateForm;
