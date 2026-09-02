import { CheckCircle, Scale } from "lucide-react";
import { formatTime12Hour, formatDateDMY } from "../utils/formatters";
import RemarksModal from "../components/modals/RemarksModal";
import HearingNotesModal from "../components/modals/HearingNotesModal";

export const GROUPED_REPORTS_CONFIG = {
  appointments: {
    title: "Completed Appointments",
    subtitle: "View case-wise completed appointments and enter progress remarks",
    apiPath: "/appointments/completed",
    icon: CheckCircle,
    modalType: "remarks",
    modalComponent: RemarksModal,
    modalProp: "appointment",
    emptyMessage: "No completed appointments found.",
    loadingMessage: "Loading completed appointments...",
    columns: [
      { 
        key: "date", 
        label: "Date",
        render: (val) => formatDateDMY(val) 
      },
      { 
        key: "time", 
        label: "Time",
        render: (_, row) => `${formatTime12Hour(row.startTime)} - ${formatTime12Hour(row.endTime)}`
      },
      { key: "clientName", label: "Client" },
    ],
    actionLabel: "Remarks",
    groupField: "caseId"
  },
  hearings: {
    title: "Hearing Report",
    subtitle: "View case-wise hearings and enter progress notes",
    apiPath: "/hearings/completed",
    icon: Scale,
    modalType: "notes",
    modalComponent: HearingNotesModal,
    modalProp: "hearing",
    emptyMessage: "No completed hearings found.",
    loadingMessage: "Loading completed hearings...",
    columns: [
      { 
        key: "date", 
        label: "Date",
        render: (val) => formatDateDMY(val) 
      },
      { 
        key: "nextHearingDate", 
        label: "Next Hearing Date",
        render: (val) => val ? formatDateDMY(val) : "—"
      },
      // { key: "time", label: "Time" },
      { key: "purposeText", label: "Purpose" }
    ],
    actionLabel: "Notes",
    groupField: "caseId"
  }
};
