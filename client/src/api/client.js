import axios from "axios";

let baseURL = import.meta.env.VITE_API_URL || "/api";
if (
  baseURL &&
  !baseURL.startsWith("http://") &&
  !baseURL.startsWith("https://") &&
  !baseURL.startsWith("/")
) {
  baseURL = `https://${baseURL}`;
}

// Ensure the baseURL ends with /api (without a trailing slash)
if (baseURL && baseURL.startsWith("http")) {
  const sanitized = baseURL.replace(/\/+$/, "");
  if (!sanitized.endsWith("/api")) {
    baseURL = `${sanitized}/api`;
  } else {
    baseURL = sanitized;
  }
}

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("ams_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
