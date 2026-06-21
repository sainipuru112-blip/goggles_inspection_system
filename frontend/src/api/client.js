import axios from "axios";
import { QueryClient } from "@tanstack/react-query";

const API_BASE = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

// ── Parts API ──────────────────────────────────────────
export const partsApi = {
  list: (params) => api.get("/api/parts", { params }).then((r) => r.data),
  create: (data) => api.post("/api/parts", data).then((r) => r.data),
  update: (id, data) => api.put(`/api/parts/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/api/parts/${id}`).then((r) => r.data),
  toggleStatus: (id, status) =>
    api.patch(`/api/parts/${id}/status`, { status }).then((r) => r.data),
};

// ── Models API ─────────────────────────────────────────
export const modelsApi = {
  list: (params) => api.get("/api/models", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/models/${id}`).then((r) => r.data),
  create: (data) => api.post("/api/models", data).then((r) => r.data),
  update: (id, data) => api.put(`/api/models/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/api/models/${id}`).then((r) => r.data),
  toggleStatus: (id, status) =>
    api.patch(`/api/models/${id}/status`, { status }).then((r) => r.data),
  assignParts: (id, partIds) =>
    api.put(`/api/models/${id}/parts`, { part_ids: partIds }).then((r) => r.data),
  getParts: (id) => api.get(`/api/models/${id}/parts`).then((r) => r.data),
  getNames: () => api.get("/api/models/names").then((r) => r.data),
};

// ── History API ────────────────────────────────────────
export const historyApi = {
  list: (params) => api.get("/api/history", { params }).then((r) => r.data),
  get: (id) => api.get(`/api/history/${id}`).then((r) => r.data),
  stats: (params) => {
    const p = typeof params === "string" ? { date: params } : params;
    return api.get("/api/history/stats", { params: p }).then((r) => r.data);
  },
  exportCsv: (params) =>
    api
      .get("/api/history/export/csv", { params, responseType: "blob" })
      .then((r) => r.data),
};

export const detectionApi = {
  getFrame: () => `${API_BASE}/api/detection/frame`,
  getResult: () => api.get("/api/detection/result").then((r) => r.data),
  getStatus: () => api.get("/api/detection/status").then((r) => r.data),
  selectModel: (id) =>
    api.post(`/api/detection/model/${id}/select`).then((r) => r.data),
  startDetection: () => api.post("/api/detection/start").then((r) => r.data),
  stopDetection: () => api.post("/api/detection/stop").then((r) => r.data),
  toggleDetection: () => api.post("/api/detection/toggle").then((r) => r.data),
};

// ── Settings API ───────────────────────────────────────
export const settingsApi = {
  get: () => api.get("/api/settings").then((r) => r.data),
  update: (data) => api.put("/api/settings", data).then((r) => r.data),
  // Camera
  switchCamera: (data) => api.post("/api/settings/camera/switch", data).then((r) => r.data),
  cameraStatus: () => api.get("/api/settings/camera/status").then((r) => r.data),
  cameraSources: () => api.get("/api/settings/camera/sources").then((r) => r.data),
};

export const WS_URL = "ws://localhost:8000/ws/detection";

export default api;
