import api from "../client";

export const masterService = {
  // Location Hierarchy API
  getStates: () => api.get("/locations/states"),
  getDistricts: (stateId) => api.get("/locations/districts", { params: { State_ID: stateId } }),
  getTaluks: (districtId) => api.get("/locations/taluks", { params: { District_ID: districtId } }),
  createState: (data) => api.post("/locations/states", data),
  updateState: (id, data) => api.put(`/locations/states/${id}`, data),
  deleteState: (id) => api.delete(`/locations/states/${id}`),
  createDistrict: (data) => api.post("/locations/districts", data),
  updateDistrict: (id, data) => api.put(`/locations/districts/${id}`, data),
  deleteDistrict: (id) => api.delete(`/locations/districts/${id}`),
  createTaluk: (data) => api.post("/locations/taluks", data),
  updateTaluk: (id, data) => api.put(`/locations/taluks/${id}`, data),
  deleteTaluk: (id) => api.delete(`/locations/taluks/${id}`),

  // Master Data API
  getCourts: (config) => api.get("/masters/courts", config),
  createCourt: (data) => api.post("/masters/courts", data),
  updateCourt: (id, data) => api.put(`/masters/courts/${id}`, data),
  deleteCourt: (id) => api.delete(`/masters/courts/${id}`),

  // Generic Master Items (Roles, Client Types, Case Types, Statuses, Judges)
  getMasterItems: (endpoint, config) => api.get(endpoint, config),
  createMasterItem: (endpoint, data) => api.post(endpoint, data),
  updateMasterItem: (endpoint, id, data) => api.put(`${endpoint}/${id}`, data),
  deleteMasterItem: (endpoint, id) => api.delete(`${endpoint}/${id}`),
};

export default masterService;
