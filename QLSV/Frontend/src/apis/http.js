// Frontend/src/api/http.js
import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
});

http.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});
