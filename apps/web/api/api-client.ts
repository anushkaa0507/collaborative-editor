import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const { data } = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

export const authApi = {
  register: (name: string, email: string, password: string) =>
    apiClient.post("/auth/register", { name, email, password }),
  login: (email: string, password: string) =>
    apiClient.post("/auth/login", { email, password }),
  refresh: (refreshToken: string) =>
    apiClient.post("/auth/refresh", { refreshToken }),
  logout: (refreshToken: string) =>
    apiClient.post("/auth/logout", { refreshToken }),
  me: () => apiClient.get("/auth/me"),
};

export const documentsApi = {
  list: () => apiClient.get("/documents"),
  getById: (id: string) => apiClient.get(`/documents/${id}`),
  create: (title: string) => apiClient.post("/documents", { title }),
  update: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch(`/documents/${id}`, payload),
  delete: (id: string) => apiClient.delete(`/documents/${id}`),
};

export const collaboratorsApi = {
  list: (docId: string) => apiClient.get(`/documents/${docId}/collaborators`),
  add: (docId: string, email: string, role: "EDITOR" | "VIEWER") =>
    apiClient.post(`/documents/${docId}/collaborators`, { email, role }),
  remove: (docId: string, userId: string) =>
    apiClient.delete(`/documents/${docId}/collaborators/${userId}`),
};

export const syncApi = {
  push: (docId: string, payload: Record<string, unknown>) =>
    apiClient.post(`/documents/${docId}/sync`, payload),
  pull: (docId: string, since?: string) =>
    apiClient.get(`/documents/${docId}/sync`, { params: { since } }),
};

export const snapshotsApi = {
  list: (docId: string) => apiClient.get(`/documents/${docId}/snapshots`),
  create: (docId: string, label?: string) =>
    apiClient.post(`/documents/${docId}/snapshots`, { label }),
  restore: (docId: string, snapshotId: string) =>
    apiClient.post(`/documents/${docId}/snapshots/${snapshotId}/restore`),
};