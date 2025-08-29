// lib/api.ts
import axios from "axios";
import { getToken } from "./auth"; // <-- make sure this exists

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
});

// Always attach token if present
api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  // Optional: avoid 304-without-body in dev
  config.headers["Cache-Control"] = "no-cache";
  return config;
});

export function setAuthToken(token?: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// Optional auto-logout/cleanup on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // localStorage.removeItem("havenia:token");
      // setAuthToken(undefined);
    }
    return Promise.reject(err);
  }
);