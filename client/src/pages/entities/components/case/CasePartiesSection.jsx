import { uppercaseAlphaAndSpaces } from "../../../../utils/validation";

export function CasePartiesSection({ errors, register }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="case-petitioner" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Petitioner
          </label>
          <div className="relative">
            <input
              id="case-petitioner"
              type="text"
              className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                errors.petitioner
                  ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
              }`}
              {...register("petitioner", { transform: (v) => uppercaseAlphaAndSpaces(v, 49) })}
              required
            />
            {errors.petitioner && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.petitioner}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="case-petitioner-advocate" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Petitioner Advocate
          </label>
          <div className="relative">
            <input
              id="case-petitioner-advocate"
              type="text"
              className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                errors.petitionerAdvocate
                  ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
              }`}
              {...register("petitionerAdvocate", { transform: (v) => uppercaseAlphaAndSpaces(v, 100) })}
              required
            />
            {errors.petitionerAdvocate && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.petitionerAdvocate}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="case-respondent" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Respondent
          </label>
          <div className="relative">
            <input
              id="case-respondent"
              type="text"
              className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                errors.respondent
                  ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
              }`}
              {...register("respondent", { transform: (v) => uppercaseAlphaAndSpaces(v, 49) })}
              required
            />
            {errors.respondent && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.respondent}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="case-respondent-advocate" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Respondent Advocate
          </label>
          <div className="relative">
            <input
              id="case-respondent-advocate"
              type="text"
              className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                errors.respondentAdvocate
                  ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
              }`}
              {...register("respondentAdvocate", { transform: (v) => uppercaseAlphaAndSpaces(v, 100) })}
              required
            />
            {errors.respondentAdvocate && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.respondentAdvocate}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default CasePartiesSection;
