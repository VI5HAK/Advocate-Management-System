import api from "../client";

export const authService = {
  login: (credentials) => api.post("/auth/login", credentials),
  getMe: () => api.get("/auth/me"),
  changePassword: (passwords) => api.post("/auth/change-password", passwords),
  getAdminUsers: () => api.get("/admins"),
  createAdminUser: (data) => api.post("/admins", data),
  updateAdminUser: (id, data) => api.put(`/admins/${id}`, data),
  deleteAdminUser: (id) => api.delete(`/admins/${id}`),
};

export default authService;
