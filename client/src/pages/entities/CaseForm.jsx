import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import entityService from "../../api/services/entity.service";
import masterService from "../../api/services/master.service";
import { CascadingLocationDropdown } from "../../components/common/CascadingLocationDropdown";
import { SubmitButton, CancelButton } from "../../components/common/ActionButtons";
import SearchableSelect from "../../components/common/SearchableSelect";
import { useForm } from "../../hooks/useForm";
import DatePicker from "../../components/ui/date-picker";
import CheckboxDropdown from "../../components/common/CheckboxDropdown";
import { Briefcase } from "lucide-react";
import CasePartiesSection from "./components/case/CasePartiesSection";
import CaseFilingDetailsSection from "./components/case/CaseFilingDetailsSection";
import {
  caseSchema,
  uppercaseAlphaAndSpaces,
  uppercaseAlphaNumAndSpaces,
  uppercaseAlphaNum,
} from "../../utils/validation";

const EMPTY_FORM = {
  clientIds: [],
  caseNumber: "",
  caseTypeId: "",
  courtId: "",
  petitioner: "",
  petitionerAdvocate: "",
  respondent: "",
  respondentAdvocate: "",
  filingDate: "",
  filingNum: "",
  regDate: "",
  regNum: "",
  cnrNum: "",
  efilingDate: "",
  efilingNum: "",
  courtName: "",
  advocateIds: [],
};

function CaseForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [caseTypes, setCaseTypes] = useState([]);
  const [courts, setCourts] = useState([]);
  const [advocates, setAdvocates] = useState([]);
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [selectedTalukCode, setSelectedTalukCode] = useState("");
  const [selectedCourtType, setSelectedCourtType] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (formValues) => {
    const payload = {
      clientIds: formValues.clientIds,
      caseNumber: formValues.caseNumber.trim(),
      caseTypeId: Number(formValues.caseTypeId),
      courtId: Number(formValues.courtId),
      petitioner: formValues.petitioner,
      petitionerAdvocate: formValues.petitionerAdvocate,
      respondent: formValues.respondent,
      respondentAdvocate: formValues.respondentAdvocate,
      filingDate: formValues.filingDate,
      filingNum: formValues.filingNum,
      regDate: formValues.regDate,
      regNum: formValues.regNum,
      cnrNum: formValues.cnrNum,
      efilingDate: formValues.efilingDate || null,
      efilingNum: formValues.efilingNum || null,
      courtName: formValues.courtName,
      advocateIds: formValues.advocateIds,
    };

    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await entityService.updateCase(id, payload);
      } else {
        await entityService.createCase(payload);
      }
      navigate("/case");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (isEdit ? "Failed to update case." : "Failed to create case."),
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
    schema: caseSchema,
    onSubmit: handleSave,
  });

  const today = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [clientsRes, caseTypesRes, courtsRes, advocatesRes] =
          await Promise.all([
            entityService.getClients(),
            masterService.getMasterItems("/masters/case-types"),
            masterService.getCourts(),
            entityService.getAdvocates(),
          ]);

        if (cancelled) return;
        setClients(clientsRes.data);
        setCaseTypes(caseTypesRes.data);
        setCourts(courtsRes.data);
        setAdvocates(advocatesRes.data);

        if (isEdit) {
          const { data } = await entityService.getCase(id);
          if (cancelled) return;
          setValues({
            clientIds: data.clientIds || [],
            caseNumber: data.caseNumber || "",
            caseTypeId: data.caseTypeId != null ? String(data.caseTypeId) : "",
            courtId: data.courtId != null ? String(data.courtId) : "",
            petitioner: data.petitioner || "",
            petitionerAdvocate: data.petitionerAdvocate || "",
            respondent: data.respondent || "",
            respondentAdvocate: data.respondentAdvocate || "",
            filingDate: data.filingDate ? data.filingDate.slice(0, 10) : "",
            filingNum: data.filingNum || "",
            regDate: data.regDate ? data.regDate.slice(0, 10) : "",
            regNum: data.regNum || "",
            cnrNum: data.cnrNum || "",
            efilingDate: data.efilingDate ? data.efilingDate.slice(0, 10) : "",
            efilingNum: data.efilingNum || "",
            courtName: data.courtName || "",
            advocateIds: data.advocateIds || [],
          });

          // Pre-populate State, District and Taluk filters based on the case's assigned court ID
          const matchedCourt = courtsRes.data.find(
            (c) => String(c.id) === String(data.courtId),
          );
          if (matchedCourt) {
            setSelectedStateCode(
              matchedCourt.State_ID != null ? String(matchedCourt.State_ID) : "",
            );
            setSelectedDistrictCode(
              matchedCourt.District_ID != null ? String(matchedCourt.District_ID) : "",
            );
            setSelectedTalukCode(
              matchedCourt.Taluk_ID != null ? String(matchedCourt.Taluk_ID) : "",
            );
            setSelectedCourtType(matchedCourt.courtType || "");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            (isEdit ? "Failed to load case." : "Failed to load dropdowns."),
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

  const getAvailableTypesForTaluk = (talukCode) => {
    if (!talukCode) {
      return ["Supreme Court", "High Court", "District Court", "Family Court", "Municipal Court", "Sessions Court"];
    }
    const types = new Set();
    courts.forEach((c) => {
      if (String(c.Taluk_ID) === String(talukCode)) {
        if (c.courtType) {
          types.add(c.courtType);
        }
      }
    });
    return Array.from(types);
  };

  const handleLocationChange = (loc) => {
    setSelectedStateCode(loc.State_ID ? String(loc.State_ID) : "");
    setSelectedDistrictCode(loc.District_ID ? String(loc.District_ID) : "");
    setSelectedTalukCode(loc.Taluk_ID ? String(loc.Taluk_ID) : "");

    if (!loc.State_ID || !loc.District_ID || !loc.Taluk_ID) {
      setSelectedCourtType("");
    } else {
      const nextAvailableTypes = getAvailableTypesForTaluk(loc.Taluk_ID);
      if (selectedCourtType && !nextAvailableTypes.includes(selectedCourtType)) {
        setSelectedCourtType("");
      }
    }
    setValue("courtId", "");
    setValue("courtName", "");
    setValue("advocateIds", []);
  };

  const handleCourtTypeChange = (value) => {
    setSelectedCourtType(value);
    setValue("courtId", "");
    setValue("courtName", "");
    setValue("advocateIds", []);
  };

  const handleCourtChange = (courtIdStr) => {
    const matched = courts.find((c) => String(c.id) === String(courtIdStr));
    setValue("courtId", courtIdStr);
    setValue("courtName", matched ? matched.name : "");
    if (!courtIdStr) {
      setValue("advocateIds", []);
    }
  };

  const handleCancel = () => {
    navigate("/case");
  };

  const filteredCourts = courts.filter((c) => {
    const matchState =
      !selectedStateCode || String(c.State_ID) === String(selectedStateCode);
    const matchDistrict =
      !selectedDistrictCode || String(c.District_ID) === String(selectedDistrictCode);
    const matchTaluk =
      !selectedTalukCode || String(c.Taluk_ID) === String(selectedTalukCode);
    const matchType = !selectedCourtType || c.courtType === selectedCourtType;
    return matchState && matchDistrict && matchTaluk && matchType;
  });

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 animate-pulse">
        <header className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Briefcase className="h-7 w-7 shrink-0" />
            </div>
            {isEdit ? "Update Case" : "Create Case"}
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
            <Briefcase className="h-7 w-7 shrink-0" />
          </div>
          {isEdit ? "Update Case" : "Create Case"}
        </h1>
      </header>

      {error && (
        <div className="p-4 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl" role="alert">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label htmlFor="case-client" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Client Name</label>
            <div className="relative">
              <CheckboxDropdown
                id="case-client"
                options={clients.map((c) => ({ id: c.id, name: c.clientName }))}
                selectedIds={values.clientIds}
                onChange={(newIds) => {
                  setValue("clientIds", newIds);
                }}
                placeholder="Select clients"
                autoFocus
              />
              {errors.clientIds && (
                <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                  {errors.clientIds}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="case-number" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Case Number</label>
            <div className="relative">
              <input
                id="case-number"
                type="text"
                className={`w-full h-11 px-4 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:bg-white ${
                  errors.caseNumber
                    ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50"
                }`}
                {...register("caseNumber")}
                required
              />
              {errors.caseNumber && (
                <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                  {errors.caseNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="case-type" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Case Type</label>
          <SearchableSelect
            id="case-type"
            value={values.caseTypeId}
            options={caseTypes.map((t) => ({ value: String(t.id), label: t.name }))}
            onChange={(val) => setValue("caseTypeId", val)}
            placeholder="Select case type"
            searchPlaceholder="Search case type..."
            emptyMessage="No case types found."
            className={errors.caseTypeId ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : ""}
          />
          {errors.caseTypeId && (
            <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
              {errors.caseTypeId}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <CascadingLocationDropdown
            State_ID={selectedStateCode}
            District_ID={selectedDistrictCode}
            Taluk_ID={selectedTalukCode}
            onChange={handleLocationChange}
            errors={errors}
            rowClassName="space-y-1.5 [&>label]:block [&>label]:text-xs [&>label]:font-bold [&>label]:text-slate-500 [&>label]:uppercase [&>label]:tracking-wider"
            inputWrapperClassName="relative"
            selectClassName="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-50 focus:bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label htmlFor="case-court-type" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Court Type</label>
            <SearchableSelect
              id="case-court-type"
              value={selectedCourtType}
              options={getAvailableTypesForTaluk(selectedTalukCode).map((type) => ({ value: type, label: type }))}
              onChange={handleCourtTypeChange}
              disabled={!selectedStateCode || !selectedDistrictCode || !selectedTalukCode}
              placeholder="Select court type"
              searchPlaceholder="Search court type..."
              emptyMessage="No court types found."
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="case-court" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Court Name</label>
            <SearchableSelect
              id="case-court"
              value={values.courtId}
              options={filteredCourts.map((c) => ({ value: String(c.id), label: c.name }))}
              onChange={handleCourtChange}
              disabled={!selectedStateCode || !selectedDistrictCode || !selectedTalukCode || !selectedCourtType}
              placeholder="Select court"
              searchPlaceholder="Search court..."
              emptyMessage="No courts found."
              className={errors.courtId ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : ""}
            />
            {errors.courtId && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.courtId}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="case-advocate" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Assign Advocate</label>
          <div className="relative">
            <CheckboxDropdown
              id="case-advocate"
              options={advocates.map((a) => ({ id: a.id, name: a.advocateName }))}
              selectedIds={values.advocateIds}
              onChange={(newIds) => {
                setValue("advocateIds", newIds);
              }}
              placeholder="Select advocates"
              disabled={!selectedStateCode || !selectedDistrictCode || !selectedTalukCode || !selectedCourtType || !values.courtId}
            />
            {errors.advocateIds && (
              <span className="text-red-500 text-xs mt-1 block text-left animate-[fadeIn_0.2s_ease-out]">
                {errors.advocateIds}
              </span>
            )}
          </div>
        </div>

        <CasePartiesSection
          errors={errors}
          register={register}
        />

        <CaseFilingDetailsSection
          values={values}
          errors={errors}
          register={register}
          setValue={setValue}
          today={today}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <CancelButton onClick={handleCancel} disabled={saving || isSubmitting} />
          <SubmitButton isEdit={isEdit} saving={saving || isSubmitting} />
        </div>
        <div className="text-[10px] font-bold text-red-500 text-right mt-2 uppercase tracking-wider">
          * All fields are mandatory except E-Filing details
        </div>
      </form>
    </div>
  );
}

export default CaseForm;
