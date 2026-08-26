import { useEffect, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import { formatDateDMY } from "../../utils/formatters";
import {
  CreateButton,
  EditButton,
  DeleteButton,
  HelpButton,
} from "../../components/ActionButtons";
import ConfirmDialog from "../../components/ConfirmDialog";
import { ChevronDown, ChevronUp, Scale } from "lucide-react";

const formatTime12h = (timeStr) => {
  if (!timeStr) return "—";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

function HearingList() {
  const { user } = useAuth();
  const isAdvocate = user?.role === "advocate";
  const navigate = useNavigate();

  const [hearings, setHearings] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for collapsible case details
  const [expandedHearingId, setExpandedHearingId] = useState(null);
  const [caseDetailsDict, setCaseDetailsDict] = useState({});
  const [caseLoadingDict, setCaseLoadingDict] = useState({});

  // State for delete confirmation
  const [hearingToDelete, setHearingToDelete] = useState(null);

  const fetchHearings = async (searchTerm = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(
        `/hearings?search=${encodeURIComponent(searchTerm)}`,
      );
      setHearings(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load hearings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHearings();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHearings(search);
  };

  const toggleExpand = async (hearingId, caseId) => {
    if (expandedHearingId === hearingId) {
      setExpandedHearingId(null);
    } else {
      setExpandedHearingId(hearingId);
      if (!caseDetailsDict[caseId] && !caseLoadingDict[caseId]) {
        setCaseLoadingDict((prev) => ({ ...prev, [caseId]: true }));
        try {
          const res = await api.get(`/cases/${caseId}`);
          setCaseDetailsDict((prev) => ({ ...prev, [caseId]: res.data }));
        } catch (err) {
          console.error("Failed to load case details:", err);
        } finally {
          setCaseLoadingDict((prev) => ({ ...prev, [caseId]: false }));
        }
      }
    }
  };

  const handleDelete = (h) => {
    setHearingToDelete(h);
  };

  const confirmDelete = async () => {
    if (!hearingToDelete) return;
    setError("");
    try {
      await api.delete(`/hearings/${hearingToDelete.id}`);
      setHearingToDelete(null);
      fetchHearings(search);
    } catch (err) {
      setHearingToDelete(null);
      setError(err.response?.data?.message || "Failed to delete hearing.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Scale className="h-8 w-8 shrink-0" />
          </div>
          Hearing List
          <HelpButton title="Hearing List" />
        </h1>
        {!isAdvocate && (
          <CreateButton
            onClick={() => navigate("/hearings/create")}
            label="Create Hearing"
          />
        )}
      </header>

      <form className="flex gap-3" onSubmit={handleSearchSubmit}>
        <div className="relative flex-1 flex">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="flex-1 w-full h-11 pl-11 pr-10 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-550/10 bg-slate-50 focus:bg-white"
            placeholder="Search by client, case, court, judge..."
            value={search}
            onChange={handleSearchChange}
          />
          {search && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-7 w-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              onClick={() => {
                setSearch("");
                fetchHearings("");
              }}
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-11 px-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] transition-all text-xs sm:text-sm font-semibold text-slate-750 inline-flex items-center gap-1.5 cursor-pointer bg-white"
        >
          <span className="hidden sm:inline">Search</span>
          <svg
            className="h-4 w-4"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </form>

      {error && (
        <div
          className="p-4 text-sm font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 font-medium shadow-sm">
          Loading hearings...
        </div>
      ) : hearings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 font-medium shadow-sm">
          No hearings scheduled.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-250 bg-slate-50/75">
                <th className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]">
                  Case Number
                </th>
                <th className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]">
                  Hearing Date
                </th>
                {/*
                <th className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]">
                  Hearing Time
                </th>
                */}
                <th className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]">
                  Advocate Name
                </th>
                {!isAdvocate && (
                  <th className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px] text-right w-[180px]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hearings.map((h) => {
                const isExpanded = expandedHearingId === h.id;
                const caseDetails = caseDetailsDict[h.caseId];
                const caseLoading = caseLoadingDict[h.caseId];

                return (
                  <Fragment key={h.id}>
                    <tr className="hover:bg-indigo-50/30 even:bg-slate-200/60 transition-colors">
                      <td className="px-5 py-4 text-slate-700 font-semibold align-middle">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleExpand(h.id, h.caseId)}
                            className="p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0 text-slate-400 hover:text-slate-650 inline-flex items-center gap-2"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            <span className="font-bold text-slate-900">
                              {h.caseNumber}
                            </span>
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700 font-semibold align-middle">
                        {formatDateDMY(h.date)}
                      </td>
                      {/*
                      <td className="px-5 py-4 text-slate-700 font-semibold align-middle">
                        {formatTime12h(h.time)}
                      </td>
                      */}
                      <td className="px-5 py-4 text-slate-700 font-semibold align-middle">
                        {h.advocateName || "—"}
                      </td>
                      {!isAdvocate && (
                        <td className="px-5 py-4 align-middle">
                          <div className="flex gap-2 justify-end">
                            <EditButton
                              onClick={() => navigate(`/hearings/${h.id}/edit`)}
                            />
                            <DeleteButton onClick={() => handleDelete(h)} />
                          </div>
                        </td>
                      )}
                    </tr>
                    {isExpanded && (
                      <tr className="bg-indigo-50/10">
                        <td
                        colSpan={isAdvocate ? 3 : 4}
                          className="px-8 py-5 border-t border-slate-100"
                        >
                          <div className="space-y-4 animate-[fadeIn_0.15s_ease-out]">
                            <h4 className="text-sm font-bold text-indigo-900 border-b border-indigo-100/50 pb-2">
                              Case Details ({h.caseNumber})
                            </h4>

                            {caseLoading ? (
                              <div className="text-xs font-medium text-slate-400 animate-pulse">
                                Loading case details...
                              </div>
                            ) : caseDetails ? (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-xs">
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                    Case Type
                                  </span>
                                  <span className="text-slate-700 font-semibold text-sm">
                                    {caseDetails.caseTypeName || "—"}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                    Court Name
                                  </span>
                                  <span className="text-slate-700 font-semibold text-sm">
                                    {caseDetails.courtName || "—"}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                    Petitioner
                                  </span>
                                  <span className="text-slate-700 font-semibold text-sm">
                                    {caseDetails.petitioner || "—"}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                    Pet Advocate
                                  </span>
                                  <span className="text-slate-700 font-semibold text-sm">
                                    {caseDetails.petitionerAdvocate || "—"}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                    Respondent
                                  </span>
                                  <span className="text-slate-700 font-semibold text-sm">
                                    {caseDetails.respondent || "—"}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                    Res Advocate
                                  </span>
                                  <span className="text-slate-700 font-semibold text-sm">
                                    {caseDetails.respondentAdvocate || "—"}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                    Filing Number
                                  </span>
                                  <span className="text-slate-700 font-semibold text-sm">
                                    {caseDetails.filingNum || "—"}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                    Filing Date
                                  </span>
                                  <span className="text-slate-700 font-semibold text-sm">
                                    {formatDateDMY(caseDetails.filingDate)}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                    Registration Number
                                  </span>
                                  <span className="text-slate-700 font-semibold text-sm">
                                    {caseDetails.regNum || "—"}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                    Registration Date
                                  </span>
                                  <span className="text-slate-700 font-semibold text-sm">
                                    {formatDateDMY(caseDetails.regDate)}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                    E-Filing Number
                                  </span>
                                  <span className="text-slate-700 font-semibold text-sm">
                                    {caseDetails.efilingNum || "—"}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                    E-Filing Date
                                  </span>
                                  <span className="text-slate-700 font-semibold text-sm">
                                    {formatDateDMY(caseDetails.efilingDate)}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                    CNR Number
                                  </span>
                                  <span className="text-slate-700 font-semibold text-sm">
                                    {caseDetails.cnrNum || "—"}
                                  </span>
                                </div>
                                <div className="col-span-2 md:col-span-4">
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                    Client Name(s)
                                  </span>
                                  <span className="text-slate-700 font-semibold text-sm">
                                    {h.clientName || "—"}
                                  </span>
                                </div>
                                <div className="col-span-2 md:col-span-4">
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                    Purpose of Hearing
                                  </span>
                                  <span className="text-slate-700 font-semibold text-sm">
                                    {h.purposeText || "—"}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs font-semibold text-red-500">
                                Failed to load case details.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!hearingToDelete}
        title="Confirm Delete"
        message={
          hearingToDelete
            ? `Are you sure you want to delete the hearing scheduled for case ${hearingToDelete.caseNumber}?`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setHearingToDelete(null)}
      />
    </div>
  );
}

export default HearingList;
