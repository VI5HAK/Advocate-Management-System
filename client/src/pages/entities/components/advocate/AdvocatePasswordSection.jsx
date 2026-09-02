import { uppercaseAlphaNum, digitsOnly } from "../../../../utils/validation";

export function AdvocatePasswordSection({
  isEdit,
  errors,
  register,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="advocate-password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <input
              id="advocate-password"
              type={showPassword ? "text" : "password"}
              className={`w-full h-11 pl-4 pr-11 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                errors.password
                  ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
              }`}
              {...register("password")}
              required={!isEdit}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-650 focus:outline-none cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
              {errors.password}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="advocate-confirm-password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="advocate-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              className={`w-full h-11 pl-4 pr-11 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                errors.confirmPassword
                  ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
              }`}
              {...register("confirmPassword")}
              required={!isEdit}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-650 focus:outline-none cursor-pointer"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
              {errors.confirmPassword}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="advocate-pan" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            PAN No
          </label>
          <div className="relative">
            <input
              id="advocate-pan"
              type="text"
              maxLength={10}
              className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                errors.panNumber
                  ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
              }`}
              {...register("panNumber", { transform: (v) => uppercaseAlphaNum(v, 10) })}
              required
            />
            {errors.panNumber && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.panNumber}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="advocate-aadhaar" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Aadhar No
          </label>
          <div className="relative">
            <input
              id="advocate-aadhaar"
              type="text"
              inputMode="numeric"
              maxLength={12}
              className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                errors.aadhaarNumber
                  ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
              }`}
              {...register("aadhaarNumber", { transform: (v) => digitsOnly(v, 12) })}
              required
            />
            {errors.aadhaarNumber && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.aadhaarNumber}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default AdvocatePasswordSection;
