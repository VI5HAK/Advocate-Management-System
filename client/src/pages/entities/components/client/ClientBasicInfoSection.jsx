import SearchableSelect from "../../../../components/common/SearchableSelect";
import { uppercaseAlphaAndSpaces } from "../../../../utils/validation";

export function ClientBasicInfoSection({
  values,
  errors,
  register,
  setValue,
  clientTypes,
  isIndividualType,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="space-y-1.5">
        <label htmlFor="client-name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Client Name
        </label>
        <div className="relative">
          <input
            id="client-name"
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
        <label htmlFor="client-type" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Client Type
        </label>
        <SearchableSelect
          id="client-type"
          value={values.clientTypeId}
          options={clientTypes.map((type) => ({
            value: String(type.id),
            label: type.name,
          }))}
          onChange={(val) => {
            const type = clientTypes.find((t) => String(t.id) === String(val));
            const individual = isIndividualType(type?.name);
            setValue("clientTypeId", val);
            setValue("gstNumber", individual ? "" : values.gstNumber);
            setValue("aadhaarNumber", individual ? values.aadhaarNumber : "");
          }}
          placeholder="Select client type"
          searchPlaceholder="Search client type..."
          emptyMessage="No client types found."
          className={
            errors.clientTypeId
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
              : ""
          }
        />
        {errors.clientTypeId && (
          <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
            {errors.clientTypeId}
          </span>
        )}
      </div>
    </div>
  );
}

export default ClientBasicInfoSection;
