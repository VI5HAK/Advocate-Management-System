import { CalendarRange, Users, Briefcase } from "lucide-react";
import { formatTime12Hour, formatDateDMY } from "../utils/formatters";

// Helper to determine status badge classes
export function getStatusBadgeClass(status) {
  const base = "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-center tracking-wider uppercase";
  if (status === "completed") {
    return `${base} bg-emerald-55 text-emerald-700 border border-emerald-100`;
  }
  if (status === "deleted") {
    return `${base} bg-red-50 text-red-700 border border-red-100`;
  }
  return `${base} bg-sky-50 text-sky-700 border border-sky-100`;
}

export const REPORTS_CONFIG = {
  advocate: {
    icon: CalendarRange,
    title: "Advocate Report",
    subtitle: "Generate and view reports of appointments by date range and advocate.",
    apiPath: "/appointments/report",
    selector: {
      label: "Advocate",
      queryParam: "advocateId",
      endpoint: "/advocates",
      optionKey: "id",
      optionLabel: "advocateName",
      allLabel: "Select All",
    },
    columns: [
      { key: "advocateName", label: "Advocate Name" },
      { key: "caseNumber", label: "Case Number" },
      { 
        key: "date", 
        label: "Appointment Date",
        render: (val) => formatDateDMY(val)
      },
      { key: "clientName", label: "Client Name", className: "hidden md:table-cell" },
      { 
        key: "startTime", 
        label: "Start Time", 
        className: "hidden md:table-cell",
        render: (val) => val ? formatTime12Hour(val) : "—"
      },
      { 
        key: "endTime", 
        label: "End Time", 
        className: "hidden md:table-cell",
        render: (val) => val ? formatTime12Hour(val) : "—"
      },
    ],
  },
  client: {
    icon: Users,
    title: "Client Report",
    subtitle: "Generate and view reports of appointments by date range and client.",
    apiPath: "/appointments/client-report",
    selector: {
      label: "Client Name",
      queryParam: "clientId",
      endpoint: "/clients",
      optionKey: "id",
      optionLabel: "clientName",
      allLabel: "Select All",
    },
    columns: [
      { key: "clientName", label: "Client Name" },
      { key: "caseNumber", label: "Case Number" },
      { 
        key: "date", 
        label: "Appointment Date",
        render: (val) => formatDateDMY(val)
      },
      { 
        key: "time", 
        label: "Time", 
        className: "hidden md:table-cell",
        render: (_, row) => {
          if (row.startTime && row.endTime) {
            return `${formatTime12Hour(row.startTime)} - ${formatTime12Hour(row.endTime)}`;
          }
          return (row.startTime ? formatTime12Hour(row.startTime) : "") || 
                 (row.endTime ? formatTime12Hour(row.endTime) : "") || "—";
        }
      },
      { key: "advocateName", label: "Advocate Assigned", className: "hidden md:table-cell" },
      {
        key: "actions",
        label: "Remarks",
        className: "hidden md:table-cell text-right w-[120px]",
        renderAction: (row, handlers) => {
          if (row.caseNumber === "NO CASE") return "—";
          return (
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-100/50 cursor-pointer"
                onClick={() => handlers.onRemarksClick(row)}
              >
                Remarks
              </button>
            </div>
          );
        }
      }
    ],
  },
  appointment: {
    icon: Briefcase,
    title: "Appointment Report",
    subtitle: "Generate and view reports of appointments grouped by case number.",
    apiPath: "/appointments/case-report",
    grouped: true,
    groupKey: "caseNumber",
    selector: {
      label: "Case Number",
      queryParam: "caseId",
      endpoint: "/cases",
      optionKey: "id",
      optionLabel: "caseNumber",
      allLabel: "Select All",
      extraOptions: [{ id: "NO_CASE", label: "NO CASE" }]
    },
    columns: [
      { 
        key: "date", 
        label: "Appointment Date",
        render: (val) => formatDateDMY(val)
      },
      { 
        key: "time", 
        label: "Time", 
        render: (_, row) => {
          if (row.startTime && row.endTime) {
            return `${formatTime12Hour(row.startTime)} - ${formatTime12Hour(row.endTime)}`;
          }
          return (row.startTime ? formatTime12Hour(row.startTime) : "") || 
                 (row.endTime ? formatTime12Hour(row.endTime) : "") || "—";
        }
      },
      { key: "clientName", label: "Client Name" },
      { key: "advocateName", label: "Advocate Assigned", className: "hidden md:table-cell" },
      {
        key: "status",
        label: "Status",
        render: (val) => (
          <span className={getStatusBadgeClass(val)}>
            {val}
          </span>
        )
      }
    ]
  }
};
