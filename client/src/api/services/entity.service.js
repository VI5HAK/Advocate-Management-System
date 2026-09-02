import api from "../client";

export const entityService = {
  // Advocates
  getAdvocates: () => api.get("/advocates"),
  getAdvocate: (id) => api.get(`/advocates/${id}`),
  createAdvocate: (data) => api.post("/advocates", data),
  updateAdvocate: (id, data) => api.put(`/advocates/${id}`, data),
  deleteAdvocate: (id) => api.delete(`/advocates/${id}`),

  // Clients
  getClients: () => api.get("/clients"),
  getClient: (id) => api.get(`/clients/${id}`),
  createClient: (data) => api.post("/clients", data),
  updateClient: (id, data) => api.put(`/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/clients/${id}`),

  // Cases
  getCases: () => api.get("/cases"),
  getCase: (id) => api.get(`/cases/${id}`),
  createCase: (data) => api.post("/cases", data),
  updateCase: (id, data) => api.put(`/cases/${id}`, data),
  deleteCase: (id) => api.delete(`/cases/${id}`),

  // Appointments
  getAppointments: () => api.get("/appointments"),
  getAppointment: (id) => api.get(`/appointments/${id}`),
  createAppointment: (data) => api.post("/appointments", data),
  updateAppointment: (id, data) => api.put(`/appointments/${id}`, data),
  deleteAppointment: (id) => api.delete(`/appointments/${id}`),
  getAppointmentRemarks: (id) => api.get(`/appointments/${id}/remarks`),
  addAppointmentRemark: (id, data) => api.post(`/appointments/${id}/remarks`, data),

  // Hearings
  getHearings: () => api.get("/hearings"),
  getHearing: (id) => api.get(`/hearings/${id}`),
  createHearing: (data) => api.post("/hearings", data),
  updateHearing: (id, data) => api.put(`/hearings/${id}`, data),
  deleteHearing: (id) => api.delete(`/hearings/${id}`),
  getHearingNotes: (id) => api.get(`/hearings/${id}/notes`),
  addHearingNote: (id, data) => api.post(`/hearings/${id}/notes`, data),

  // Generic Entity Methods
  getByPath: (path, config) => api.get(path, config),
  deleteByPath: (path, id) => api.delete(`${path}/${id}`),

  // Dashboard & Reports
  getDashboardSummary: () => api.get("/dashboard/summary"),
  getReport: (endpoint, params) => api.get(endpoint, { params }),
};

export default entityService;
