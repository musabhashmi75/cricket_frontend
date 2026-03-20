import axios from "axios";

const STORAGE_KEY = "cricket_auth";

const apiClient = axios.create({
  baseURL: "/api", // 🔥 IMPORTANT: use Vercel rewrite
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request: attach JWT ──────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { token } = JSON.parse(raw);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: handle errors ──────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEY);

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    const data = error.response?.data;

    const message =
      data?.message ||
      (Array.isArray(data?.details) ? data.details.join(", ") : null) ||
      error.message ||
      "An unexpected error occurred";

    return Promise.reject(new Error(message));
  }
);

export default apiClient;