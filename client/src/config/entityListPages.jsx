export const ENTITY_LIST_CONFIG = {
  advocate: {
    apiPath: "/advocates",
    title: "Advocate",
    createButtonLabel: "Create Advocate",
    createPath: "/advocate/create",
    updatePath: (id) => `/advocate/${id}/edit`,
    searchPlaceholder:
      "Search by advocate name, role, contact number, or email",
    emptyMessage: "No advocates found.",
    loadErrorMessage: "Failed to load advocates.",
    deleteErrorMessage: "Failed to delete advocate.",
    deleteConfirm: (row) => `Do you want to delete advocate "${row.advocateName}"?`,
    columns: [
      { key: "advocateName", label: "Advocate Name" },
      { key: "roleName", label: "Role" },
      { key: "contactNumber", label: "Contact Number" },
      { key: "emailId", label: "Email ID" },
    ],
  },
  client: {
    apiPath: "/clients",
    title: "Client",
    createButtonLabel: "Create Client",
    createPath: "/client/create",
    updatePath: (id) => `/client/${id}/edit`,
    searchPlaceholder:
      "Search by client name, type, contact number, or email",
    emptyMessage: "No clients found.",
    loadErrorMessage: "Failed to load clients.",
    deleteErrorMessage: "Failed to delete client.",
    deleteConfirm: (row) => `Do you want to delete client "${row.clientName}"?`,
    columns: [
      { key: "clientName", label: "Client Name" },
      { key: "clientType", label: "Client Type" },
      { key: "contactNumber", label: "Contact Number" },
      { key: "emailId", label: "Email ID" },
    ],
  },
  case: {
    apiPath: "/cases",
    title: "Case",
    createButtonLabel: "Create Case",
    createPath: "/case/create",
    updatePath: (id) => `/case/${id}/edit`,
    searchPlaceholder:
      "Search by client name, case number, petitioner, or respondent",
    emptyMessage: "No cases found.",
    loadErrorMessage: "Failed to load cases.",
    deleteErrorMessage: "Failed to delete case.",
    deleteConfirm: (row) => `Do you want to delete case "${row.caseNumber}"?`,
    columns: [
      {
        key: "clientName",
        label: "Client Name",
        render: (value) => {
          const clientNames = value.split(",").map((n) => n.trim()).filter(Boolean);
          if (clientNames.length > 1) {
            return (
              <div className="client-names-list">
                {clientNames.map((name, idx) => (
                  <div key={idx} className="client-name-item">
                    <span className="multiple-clients-dot" title="Multiple clients"></span>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            );
          }
          return value;
        },
      },
      { key: "caseNumber", label: "Case Number" },
      { key: "petitioner", label: "Petitioner" },
      { key: "respondent", label: "Respondent" },
    ],
  },
  appointment: {
    apiPath: "/appointments",
    title: "Appointments",
    createButtonLabel: "Create Appointment",
    createPath: "/appointments/create",
    updatePath: (id) => `/appointments/${id}/edit`,
    searchPlaceholder: "Search by client, case number, advocate, date, or time",
    emptyMessage: "No appointments found.",
    loadErrorMessage: "Failed to load appointments.",
    deleteErrorMessage: "Failed to delete appointment.",
    deleteConfirm: (row) =>
      `Do you want to delete appointment for "${row.clientName}" on ${row.date || "—"}?`,
    columns: [
      { key: "clientName", label: "Client Name" },
      { key: "caseNumber", label: "Case Number" },
      {
        key: "advocateName",
        label: "Advocate Name",
        render: (value) => {
          const advocateNames = value.split(",").map((n) => n.trim()).filter(Boolean);
          if (advocateNames.length > 1) {
            return (
              <div className="client-names-list">
                {advocateNames.map((name, idx) => (
                  <div key={idx} className="client-name-item">
                    <span className="multiple-clients-dot" title="Multiple advocates"></span>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            );
          }
          return value;
        },
      },
      { key: "date", label: "Date" },
      { key: "startTime", label: "Start Time" },
      { key: "endTime", label: "End Time" },
    ],
  },
};
