import { useState, useEffect } from "react";
import api from "../api/client";
import { CustomDatePicker } from "../components/CustomDatePicker";
import { formatTime12Hour, formatDateDMY } from "../utils/formatters";
import { CalendarRange } from "lucide-react";

function ReportsPage() {
  const [advocates, setAdvocates] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [advocateId, setAdvocateId] = useState("all");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    async function fetchAdvocates() {
      try {
        const { data } = await api.get("/advocates");
        setAdvocates(data);
      } catch (err) {
        console.error("Failed to load advocates", err);
        setError("Failed to load advocates.");
      }
    }
    fetchAdvocates();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError("Start date and End date are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await api.get("/appointments/report", {
        params: { startDate, endDate, advocateId },
      });
      setAppointments(data);
      setSearched(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setAdvocateId("all");
    setAppointments([]);
    setError("");
    setSearched(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <header className="border-b border-slate-100 pb-4">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarRange className="h-8 w-8 shrink-0" />
            </div>
            Appointment Report
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Generate and view reports of appointments by date range and advocate.
          </p>
        </header>

        {error && (
          <div className="p-4 text-sm font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl animate-[fadeIn_0.2s_ease-out]" role="alert">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label htmlFor="start-date" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
              <CustomDatePicker
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="end-date" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">End Date</label>
              <CustomDatePicker
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="advocate" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Advocate</label>
              <select
                id="advocate"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-50 focus:bg-white cursor-pointer"
                value={advocateId}
                onChange={(e) => setAdvocateId(e.target.value)}
              >
                <option value="all">Select All</option>
                {advocates.map((adv) => (
                  <option key={adv.id} value={adv.id}>
                    {adv.advocateName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-100/50 cursor-pointer disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
        </form>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading report data...</p>
        </div>
      )}

      {!loading && searched && (
        <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-4 rounded-full bg-slate-100 text-slate-400 mb-3">
                <CalendarRange className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No appointments found</h3>
              <p className="text-sm text-slate-500 max-w-xs mt-1">No appointments match the selected date range and advocate criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-250 bg-slate-50/75">
                    <th className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]">Advocate Name</th>
                    <th className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]">Case Number</th>
                    <th className="px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]">Appointment Date</th>
                    <th className="hidden md:table-cell px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]">Client Name</th>
                    <th className="hidden md:table-cell px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]">Start Time</th>
                    <th className="hidden md:table-cell px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px]">End Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((appoint) => (
                    <tr key={appoint.id} className="hover:bg-indigo-50/30 even:bg-slate-200/60 transition-colors">
                      <td className="px-5 py-4 text-slate-700 font-semibold align-middle">{appoint.advocateName || "—"}</td>
                      <td className="px-5 py-4 text-slate-650 font-semibold align-middle">{appoint.caseNumber}</td>
                      <td className="px-5 py-4 text-slate-650 font-semibold align-middle">{formatDateDMY(appoint.date)}</td>
                      <td className="hidden md:table-cell px-5 py-4 text-slate-650 align-middle">{appoint.clientName}</td>
                      <td className="hidden md:table-cell px-5 py-4 text-slate-650 align-middle">
                        {appoint.startTime ? formatTime12Hour(appoint.startTime) : "—"}
                      </td>
                      <td className="hidden md:table-cell px-5 py-4 text-slate-650 align-middle">
                        {appoint.endTime ? formatTime12Hour(appoint.endTime) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
