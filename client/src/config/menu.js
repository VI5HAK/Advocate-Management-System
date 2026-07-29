export const ADMIN_MENU_ITEMS = [
  { id: "home", label: "Home", path: "/" },
  { id: "dashboard", label: "Dashboard", path: "/dashboard" },
  {
    id: "masters",
    label: "Masters",
    children: [
      { id: "role", label: "Role", path: "/masters/role" },
      { id: "client-type", label: "Client Type", path: "/masters/client-type" },
      { id: "case-type", label: "Case Type", path: "/masters/case-type" },
      { id: "court", label: "Court", path: "/masters/court" },
    ],
  },
  //Remove comment to add admins page
  //{ id: "admins", label: "Admin Users", path: "/admins" },
  { id: "advocate", label: "Advocate", path: "/advocate" },
  { id: "client", label: "Client", path: "/client" },
  { id: "case", label: "Case", path: "/case" },
  { id: "appointments", label: "Appointments", path: "/appointments" },
  {
    id: "reports",
    label: "Reports",
    children: [
      { id: "appointment-report", label: "Appointment Report", path: "/reports/appointment" },
      { id: "client-report", label: "Client Report", path: "/reports/client" },
      { id: "case-report", label: "Case Report", path: "/reports/case" },
    ],
  },
];

export const ADVOCATE_MENU_ITEMS = [
  { id: "home", label: "Home", path: "/" },
  { id: "appointments", label: "Appointments", path: "/appointments" },
  { id: "completed-appointments", label: "Completed Appointments", path: "/completed-appointments" },
];

export function getMenuItemsForRole(role) {
  return role === "advocate" ? ADVOCATE_MENU_ITEMS : ADMIN_MENU_ITEMS;
}
