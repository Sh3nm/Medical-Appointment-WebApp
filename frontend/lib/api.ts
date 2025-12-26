import axios from "axios";
import { getStoredToken, clearAuth } from "./auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || process.env.API_KEY || "http://localhost:3001",
  withCredentials: true,
});

// Attach Authorization header from localStorage token on each request.
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;