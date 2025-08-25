import axios from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
});

export function setAuthToken(token?: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// (Optional) auto-logout or cleanup on 401s:
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // e.g. clear token storage, redirect to login, etc.
      // localStorage.removeItem("havenia:token");
      // setAuthToken(undefined);
    }
    return Promise.reject(err);
  }
);
