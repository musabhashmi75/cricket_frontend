import axios from 'axios';

const STORAGE_KEY = 'cricket_auth';

// 👇 IMPORTANT CHANGE HERE
const BASE_URL = import.meta.env.VITE_API_URL || 'http://103.127.29.90:8081';

const client = axios.create({
  baseURL: `${BASE_URL}/api`, // ✅ FIXED
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach JWT ────────────────────────────────────────────────────
client.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const { token } = JSON.parse(raw);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch { /* ignore */ }
  return config;
});

// ── Response: normalise errors, handle 401 ────────────────────────────────
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEY);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const data    = err.response?.data;
    const message =
      data?.message ||
      (Array.isArray(data?.details) ? data.details.join(', ') : null) ||
      err.message  ||
      'An unexpected error occurred';

    return Promise.reject(new Error(message));
  }
);

export default client;  