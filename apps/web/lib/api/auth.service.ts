import apiClient from "@/api/api-client";

export const authService = {
  async register(name: string, email: string, password: string) {
    const { data } = await apiClient.post("/auth/register", { name, email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data;
  },

  async login(email: string, password: string) {
    const { data } = await apiClient.post("/auth/login", { email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data;
  },

  async logout() {
    const refreshToken = localStorage.getItem("refreshToken");
    await apiClient.post("/auth/logout", { refreshToken }).catch(() => {});
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  async me() {
    const { data } = await apiClient.get("/auth/me");
    return data;
  },
};