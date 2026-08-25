import { useState, useEffect, useCallback } from "react";
import api from "../../api/client";

export function GroupedCompletedReport({ config }) {
  const IconComponent = config.icon;
  const ModalComponent = config.modalComponent;
  const { title, subtitle, apiPath, columns, actionLabel, groupField, emptyMessage, loadingMessage, modalProp, autoExpand } = config;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCases, setExpandedCases] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(apiPath);
      setItems(data || []);
      
      // Auto-expand cases if configured
      const initialExpanded = {};
      if (autoExpand) {
        data.forEach((item) => {
          const caseKey = item.caseId || "no-case";
          initialExpanded[caseKey] = true;
        });
      }
      setExpandedCases(initialExpanded);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || `Failed to fetch report data.`);
    } finally {
      setLoading(false);
    }
  }, [apiPath, autoExpand]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const toggleCase = (caseId) => {
    setExpandedCases((prev) => ({
      ...prev,
      [caseId]: !prev[caseId],
    }));
  };

  // Group items by Case ID
  const grouped = items.reduce((acc, item) => {
    const caseKey = item.caseId || "no-case";
    if (!acc[caseKey]) {
      acc[caseKey] = {
        caseId: item.caseId,
        caseNumber: item.caseNumber || "NO CASE",
        clientName: item.clientName || "—",
        advocateName: item.advocateName || "—",
        rows: [],
      };
    }
    acc[caseKey].rows.push(item);
    return acc;
  }, {});

  // Convert grouped to array and filter by search term
  const groupedArray = Object.values(grouped).filter((group) => {
    const term = searchTerm.toLowerCase();
    return (
      group.caseNumber.toLowerCase().includes(term) ||
      group.clientName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="completed-appts-container">
      <div className="completed-appts-header-section">
        <h1 className="completed-appts-title flex items-center gap-2.5">
          <IconComponent className="h-8 w-8 text-indigo-650 shrink-0" />
          {title}
        </h1>
        <p className="completed-appts-subtitle">{subtitle}</p>
      </div>

      <div className="completed-appts-filters">
        <div className="completed-appts-search-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="completed-appts-search-input"
            placeholder="Search by Case Number or Client Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="completed-appts-refresh-btn"
          onClick={fetchItems}
          aria-label={`Refresh ${title.toLowerCase()}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"></path>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="completed-appts-state-container">
          <div className="completed-appts-spinner"></div>
          <p>{loadingMessage}</p>
        </div>
      ) : error ? (
        <div className="completed-appts-state-container completed-appts-error-container">
          <p className="completed-appts-error-msg">{error}</p>
          <button type="button" className="master-btn btn-create" onClick={fetchItems}>
            Retry
          </button>
        </div>
      ) : groupedArray.length === 0 ? (
        <div className="completed-appts-state-container completed-appts-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="completed-appts-list">
          {groupedArray.map((group) => {
            const isExpanded = expandedCases[group.caseId || "no-case"] !== false;
            return (
              <div key={group.caseId || "no-case"} className="completed-case-card">
                <div
                  className="completed-case-header"
                  onClick={() => toggleCase(group.caseId || "no-case")}
                  role="button"
                  aria-expanded={isExpanded}
                  tabIndex="0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      toggleCase(group.caseId || "no-case");
                    }
                  }}
                >
                  <div className="completed-case-info">
                    <h2 className="completed-case-num">{group.caseNumber}</h2>
                    <span className="completed-case-client">Client: {group.clientName}</span>
                    {config.modalType === "notes" && (
                      <span className="completed-case-client">Advocate: {group.advocateName}</span>
                    )}
                  </div>
                  <div className="completed-case-header-actions">
                    <span className="completed-appts-count">
                      {group.rows.length} {config.modalType === "notes" ? "hearing" : "appointment"}{group.rows.length > 1 ? "s" : ""}
                    </span>
                    <svg
                      className={`completed-case-chevron ${isExpanded ? "is-expanded" : ""}`}
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="completed-case-body">
                    <div className="completed-table-wrapper">
                      <table className="completed-table">
                        <thead>
                          <tr>
                            {columns.map((col) => (
                              <th key={col.key}>{col.label}</th>
                            ))}
                            <th className="actions-column">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.rows.map((row) => (
                            <tr key={row.id} className="hover:bg-indigo-50/30 even:bg-slate-200/60 transition-colors">
                              {columns.map((col) => (
                                <td key={col.key}>
                                  {col.render ? col.render(row[col.key], row) : (row[col.key] || "—")}
                                </td>
                              ))}
                              <td className="actions-column">
                                <button
                                  type="button"
                                  className="master-btn btn-update completed-remarks-btn"
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
          onClose={() => {
            setSelectedItem(null);
            fetchItems(); // Refetch to ensure changes (remarks/notes count or dates) reflect immediately
          }}
        />
      )}
    </div>
  );
}

export default GroupedCompletedReport;
