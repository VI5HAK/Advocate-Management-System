import DatePicker from "../../../../components/ui/date-picker";
import { uppercaseAlphaNumAndSpaces, uppercaseAlphaNum } from "../../../../utils/validation";

export function CaseFilingDetailsSection({
  values,
  errors,
  register,
  setValue,
  today,
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="case-filing-num" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Filing Number
          </label>
          <div className="relative">
            <input
              id="case-filing-num"
              type="text"
              className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                errors.filingNum
                  ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
              }`}
              {...register("filingNum", { transform: (v) => uppercaseAlphaNumAndSpaces(v, 100) })}
              required
            />
            {errors.filingNum && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.filingNum}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="case-filing-date" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Filing Date
          </label>
          <div className="relative">
            <DatePicker
              id="case-filing-date"
              value={values.filingDate}
              onChange={(val) => setValue("filingDate", val)}
              max={today}
              required
            />
            {errors.filingDate && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.filingDate}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="case-reg-num" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Registration Number
          </label>
          <div className="relative">
            <input
              id="case-reg-num"
              type="text"
              className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                errors.regNum
                  ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
              }`}
              {...register("regNum", { transform: (v) => uppercaseAlphaNumAndSpaces(v, 100) })}
              required
            />
            {errors.regNum && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.regNum}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="case-reg-date" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Registration Date
          </label>
          <div className="relative">
            <DatePicker
              id="case-reg-date"
              value={values.regDate}
              onChange={(val) => setValue("regDate", val)}
              required
            />
            {errors.regDate && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.regDate}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="case-efiling-num" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            E-Filing Number
          </label>
          <div className="relative">
            <input
              id="case-efiling-num"
              type="text"
              className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                errors.efilingNum
                  ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
              }`}
              {...register("efilingNum", { transform: (v) => uppercaseAlphaNumAndSpaces(v, 100) })}
            />
            {errors.efilingNum && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.efilingNum}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="case-efiling-date" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            E-Filing Date
          </label>
          <div className="relative">
            <DatePicker
              id="case-efiling-date"
              value={values.efilingDate}
              onChange={(val) => setValue("efilingDate", val)}
            />
            {errors.efilingDate && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.efilingDate}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="case-cnr-num" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          CNR Number
        </label>
        <div className="relative">
          <input
            id="case-cnr-num"
            type="text"
            className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
              errors.cnrNum
                ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
            }`}
            {...register("cnrNum", { transform: (v) => uppercaseAlphaNum(v, 16) })}
            required
          />
          {errors.cnrNum && (
            <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
              {errors.cnrNum}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

export default CaseFilingDetailsSection;
