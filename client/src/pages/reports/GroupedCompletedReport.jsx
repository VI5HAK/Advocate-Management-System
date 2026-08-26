import { useState, useEffect, useCallback } from "react";
import api from "../../api/client";
import { ChevronDown, Search, RotateCw } from "lucide-react";
import { HelpButton } from "../../components/ActionButtons";
import "../../styles/EntityListPage.css";

export function GroupedCompletedReport({ config }) {
  const IconComponent = config.icon;
  const ModalComponent = config.modalComponent;
  const {
    title,
    subtitle,
    apiPath,
    columns,
    actionLabel,
    emptyMessage,
    loadingMessage,
    modalProp,
    autoExpand,
  } = config;

  const [items, setItems] = useState([]); // This will hold case summaries
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCases, setExpandedCases] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);

  // New state to cache detailed rows per case
  const [caseDetails, setCaseDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(apiPath);
      setItems(data || []);
      // Reset expanded states and loaded details on refresh
      setExpandedCases({});
      setCaseDetails({});
      setLoadingDetails({});
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || `Failed to fetch report data.`);
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const toggleCase = async (caseId) => {
    const isExpanding = !expandedCases[caseId];
    setExpandedCases((prev) => ({
      ...prev,
      [caseId]: isExpanding,
    }));

    if (isExpanding && !caseDetails[caseId]) {
      setLoadingDetails((prev) => ({ ...prev, [caseId]: true }));
      try {
        const { data } = await api.get(`${apiPath}?caseId=${caseId}`);
        setCaseDetails((prev) => ({
          ...prev,
          [caseId]: data || [],
        }));
      } catch (err) {
        console.error(`Failed to fetch details for case: ${caseId}`, err);
      } finally {
        setLoadingDetails((prev) => ({ ...prev, [caseId]: false }));
      }
    }
  };

  // Convert summaries to array and filter by search term
  const filteredSummaries = items.filter((group) => {
    const term = searchTerm.toLowerCase();
    return (
      (group.caseNumber || "NO CASE").toLowerCase().includes(term) ||
      (group.clientName || "—").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header section */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <IconComponent className="h-8 w-8 shrink-0" />
            </div>
            {title}
            <HelpButton title={title} />
          </h1>
          <p className="text-sm font-medium text-slate-500">{subtitle}</p>
        </div>
      </header>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full flex">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            className="flex-1 w-full h-11 pl-11 pr-10 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm bg-slate-50 focus:bg-white"
            placeholder="Search by Case Number or Client Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-7 w-7 rounded-full text-slate-400 hover:text-slate-650 hover:bg-slate-100 transition-all cursor-pointer"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          className="h-11 w-full sm:w-auto px-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] transition-all text-sm font-semibold text-slate-700 flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-slate-100/50"
          onClick={fetchItems}
          aria-label={`Refresh ${title.toLowerCase()}`}
        >
          <RotateCw className="h-4 w-4 text-slate-550 shrink-0" />
          Refresh
        </button>
      </div>

      {/* Main Content Areas */}
      {loading ? (
        <div className="bg-white/80 rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium text-sm">{loadingMessage}</p>
        </div>
      ) : error ? (
        <div className="bg-red-50/50 rounded-2xl border border-red-150 p-10 text-center flex flex-col items-center justify-center gap-4">
          <p className="text-red-750 font-semibold text-sm">{error}</p>
          <button
            type="button"
            className="h-10 px-5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-red-650 hover:bg-red-700 transition-all shadow-sm cursor-pointer"
            onClick={fetchItems}
          >
            Retry
          </button>
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div className="bg-white/80 rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm flex flex-col items-center justify-center gap-4 backdrop-blur-sm text-slate-400">
          <div className="p-4 bg-slate-50 border border-slate-150 text-slate-400 rounded-2xl">
            <IconComponent className="h-10 w-10 text-slate-400" />
          </div>
          <p className="font-bold text-slate-800 text-lg">{emptyMessage}</p>
          <p className="text-sm text-slate-500 max-w-sm">
            There are currently no completed records listed in this section matching your selection.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSummaries.map((group) => {
            const key = group.caseId || "no-case";
            const isExpanded = expandedCases[key] === true;
            const rows = caseDetails[key] || [];
            const isLoading = loadingDetails[key] === true;
            return (
              <div
                key={key}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-350 hover:shadow-md hover:border-slate-300/60"
              >
                <button
                  type="button"
                  className="w-full text-left p-5 flex items-center justify-between cursor-pointer select-none bg-slate-50/40 hover:bg-slate-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                  onClick={() => toggleCase(key)}
                  aria-expanded={isExpanded}
                >
                  <div className="flex flex-col gap-1">
                    <h2 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                      {group.caseNumber}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        Client: {group.clientName}
                      </span>
                      {config.modalType === "notes" && (
                        <span className="inline-flex items-center text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                          Advocate: {group.advocateName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100/80 border border-slate-200/40 px-2.5 py-1 rounded-lg">
                      {group.count}{" "}
                      {config.modalType === "notes" ? "hearing" : "appointment"}
                      {group.count > 1 ? "s" : ""}
                    </span>
                    <div
                      className={`p-1.5 rounded-lg bg-white border border-slate-150 shadow-sm text-slate-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-slate-700" : ""
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200/60 bg-white">
                    {isLoading ? (
                      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <span>Loading details...</span>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/75">
                              {columns.map((col) => (
                                <th
                                  key={col.key}
                                  className="px-5 py-3.5 font-bold text-slate-550 uppercase tracking-wider text-[10px] whitespace-nowrap"
                                >
                                  {col.label}
                                </th>
                              ))}
                              <th className="px-5 py-3.5 font-bold text-slate-550 uppercase tracking-wider text-[10px] text-right w-[120px]">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {rows.map((row) => (
                              <tr
                                key={row.id}
                                className="hover:bg-slate-50/30 even:bg-slate-50/15 transition-colors duration-150"
                              >
                                {columns.map((col) => (
                                  <td
                                    key={col.key}
                                    className="px-5 py-4 text-slate-700 font-medium align-middle"
                                  >
                                    {col.render
                                      ? col.render(row[col.key], row)
                                      : row[col.key] || "—"}
                                  </td>
                                ))}
                                <td className="px-5 py-4 text-right align-middle">
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-1 h-8 px-3.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-100/40 cursor-pointer"
                                    onClick={() => setSelectedItem(row)}
                                  >
                                    {actionLabel}
                                  </button>
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
          })}
        </div>
      )}

      {selectedItem && ModalComponent && (
        <ModalComponent
          {...{ [modalProp]: selectedItem }}
          onClose={async () => {
            const caseKey = selectedItem.caseId || "no-case";
            setSelectedItem(null);
            
            // Refetch summaries list
            await fetchItems();
            
            // Refetch details for the specific case to keep UI updated
            setLoadingDetails((prev) => ({ ...prev, [caseKey]: true }));
            try {
              const { data } = await api.get(`${apiPath}?caseId=${caseKey}`);
              setCaseDetails((prev) => ({
                ...prev,
                [caseKey]: data || [],
              }));
            } catch (err) {
              console.error("Failed to reload details:", err);
            } finally {
              setLoadingDetails((prev) => ({ ...prev, [caseKey]: false }));
            }
          }}
        />
      )}
    </div>
  );
}

export default GroupedCompletedReport;
