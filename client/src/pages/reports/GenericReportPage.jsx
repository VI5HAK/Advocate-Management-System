import { useState, useEffect, useCallback } from "react";
import api from "../../api/client";
import { CustomDatePicker } from "../../components/CustomDatePicker";
import RemarksModal from "../../components/RemarksModal";
import { SearchableSelect } from "../../components/SearchableSelect";
import { HelpButton } from "../../components/ActionButtons";

export function GenericReportPage({ config }) {
  const IconComponent = config.icon;
  const { title, subtitle, apiPath, selector, columns, grouped, groupKey } = config;

  const [dropdownItems, setDropdownItems] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectorValue, setSelectorValue] = useState("all");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectorLoading, setSelectorLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedRemarksAppt, setSelectedRemarksAppt] = useState(null);

  // Reset page state and fetch selector options on config changes
  useEffect(() => {
    setStartDate("");
    setEndDate("");
    setSelectorValue("all");
    setReportData([]);
    setError("");
    setSearched(false);
    setSelectedRemarksAppt(null);

    async function fetchSelectorOptions() {
      setSelectorLoading(true);
      try {
        const { data } = await api.get(selector.endpoint);
        let items = data || [];
        if (selector.extraOptions) {
          items = [...selector.extraOptions, ...items];
        }
        setDropdownItems(items);
      } catch (err) {
        console.error(`Failed to load options for ${selector.label}`, err);
        setError(`Failed to load ${selector.label.toLowerCase()} dropdown options.`);
      } finally {
        setSelectorLoading(false);
      }
    }

    if (selector.endpoint) {
      fetchSelectorOptions();
    }
  }, [config, selector.endpoint, selector.label, selector.extraOptions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError("Start date and End date are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const params = {
        startDate,
        endDate,
        [selector.queryParam]: selectorValue,
      };
      const { data } = await api.get(apiPath, { params });
      setReportData(data || []);
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
    setSelectorValue("all");
    setReportData([]);
    setError("");
    setSearched(false);
    setSelectedRemarksAppt(null);
  };

  // Grouping logic if required by config
  const groupedData = useCallback(() => {
    if (!grouped) return {};
    return reportData.reduce((acc, row) => {
      const keyVal = row[groupKey] || "NO CASE";
      if (!acc[keyVal]) {
        acc[keyVal] = [];
      }
      acc[keyVal].push(row);
      return acc;
    }, {});
  }, [reportData, grouped, groupKey]);

  const groupEntries = grouped ? Object.entries(groupedData()) : [];

  const handleRemarksClick = (row) => {
    setSelectedRemarksAppt(row);
  };

  const handlers = {
    onRemarksClick: handleRemarksClick
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <header className="border-b border-slate-100 pb-4">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <IconComponent className="h-8 w-8 shrink-0" />
            </div>
            {title}
            <HelpButton title={title} />
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">{subtitle}</p>
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
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-550/10 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="end-date" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">End Date</label>
              <CustomDatePicker
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-550/10 bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <label htmlFor="report-selector" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{selector.label}</label>
              <SearchableSelect
                id="report-selector"
                options={[
                  { value: "all", label: selector.allLabel },
                  ...dropdownItems.map((item) => ({
                    value: String(item[selector.optionKey]),
                    label: item[selector.optionLabel] || item.label || String(item[selector.optionKey]),
                  })),
                ]}
                value={selectorValue}
                onChange={(val) => setSelectorValue(val)}
                disabled={selectorLoading}
                placeholder={`Select ${selector.label}`}
                searchPlaceholder={`Search ${selector.label.toLowerCase()}...`}
              />
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
              className="inline-flex items-center justify-center h-10 px-6 rounded-xl text-xs sm:text-sm font-bold text-white btn-grad-create active:scale-[0.97] cursor-pointer disabled:opacity-50 disabled:pointer-events-none tracking-wide"
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
        <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
          {reportData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-4 rounded-full bg-slate-100 text-slate-400 mb-3">
                <IconComponent className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No records found</h3>
              <p className="text-sm text-slate-500 max-w-xs mt-1">No appointments match the selected criteria and date range.</p>
            </div>
          ) : grouped ? (
            groupEntries.map(([groupName, list]) => (
              <div key={groupName} className="space-y-3">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pl-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selector.label}:</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">{groupName}</span>
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-250 bg-slate-50/75">
                        {columns.map((col) => (
                          <th key={col.key} className={`px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px] ${col.className || ""}`}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {list.map((row) => (
                        <tr key={row.id} className="hover:bg-indigo-50/30 even:bg-slate-200/60 transition-colors">
                          {columns.map((col) => (
                            <td key={col.key} className={`px-5 py-4 text-slate-700 font-semibold align-middle ${col.className || ""}`}>
                              {col.renderAction ? col.renderAction(row, handlers) : (col.render ? col.render(row[col.key], row) : row[col.key] || "—")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-250 bg-slate-50/75">
                    {columns.map((col) => (
                      <th key={col.key} className={`px-5 py-4 font-bold text-slate-550 uppercase tracking-wider text-[11px] ${col.className || ""}`}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((row) => (
                    <tr key={row.id} className="hover:bg-indigo-50/30 even:bg-slate-200/60 transition-colors">
                      {columns.map((col) => (
                        <td key={col.key} className={`px-5 py-4 text-slate-700 font-semibold align-middle ${col.className || ""}`}>
                          {col.renderAction ? col.renderAction(row, handlers) : (col.render ? col.render(row[col.key], row) : row[col.key] || "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedRemarksAppt && (
        <RemarksModal
          appointment={selectedRemarksAppt}
          onClose={() => setSelectedRemarksAppt(null)}
          readOnly={true}
        />
      )}
    </div>
  );
}

export default GenericReportPage;
