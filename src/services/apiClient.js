import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api", // ✅ IMPORTANT (use Vercel rewrite)
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;