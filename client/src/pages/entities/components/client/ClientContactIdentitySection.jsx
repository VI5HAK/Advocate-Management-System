import { digitsOnly, uppercaseAlphaNum } from "../../../../utils/validation";

export function ClientContactIdentitySection({
  values,
  errors,
  register,
  showAadhaar,
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1.5 col-span-1">
          <label htmlFor="client-Pincode" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Pincode
          </label>
          <div className="relative">
            <input
              id="client-Pincode"
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
          <label htmlFor="client-contact-person" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Contact Person Name
          </label>
          <div className="relative">
            <input
              id="client-contact-person"
              type="text"
              className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                errors.contactPerson
                  ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
              }`}
              {...register("contactPerson", { transform: (v) => v.slice(0, 50) })}
              required
            />
            {errors.contactPerson && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.contactPerson}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="client-contact" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Contact No
          </label>
          <div className="relative">
            <input
              id="client-contact"
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
          <label htmlFor="client-alt-contact" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Alternate Contact No
          </label>
          <div className="relative">
            <input
              id="client-alt-contact"
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

      <div className="space-y-1.5">
        <label htmlFor="client-email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Email Id
        </label>
        <div className="relative">
          <input
            id="client-email"
            type="email"
            className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
              errors.emailId
                ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
            }`}
            {...register("emailId")}
          />
          {errors.emailId && (
            <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
              {errors.emailId}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="client-pan" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            PAN No
          </label>
          <div className="relative">
            <input
              id="client-pan"
              type="text"
              maxLength={10}
              className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                errors.panNumber
                  ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
              }`}
              {...register("panNumber", { transform: (v) => uppercaseAlphaNum(v, 10) })}
            />
            {errors.panNumber && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.panNumber}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          {showAadhaar ? (
            <>
              <label htmlFor="client-aadhaar" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Aadhar No
              </label>
              <div className="relative">
                <input
                  id="client-aadhaar"
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                    errors.aadhaarNumber
                      ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
                  }`}
                  {...register("aadhaarNumber", { transform: (v) => digitsOnly(v, 12) })}
                />
                {errors.aadhaarNumber && (
                  <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                    {errors.aadhaarNumber}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <label htmlFor="client-gst" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                GST No
              </label>
              <div className="relative">
                <input
                  id="client-gst"
                  type="text"
                  maxLength={15}
                  className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                    errors.gstNumber
                      ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
                  }`}
                  {...register("gstNumber", { transform: (v) => uppercaseAlphaNum(v, 15) })}
                />
                {errors.gstNumber && (
                  <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                    {errors.gstNumber}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default ClientContactIdentitySection;
