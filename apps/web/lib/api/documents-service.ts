import apiClient from "@/api/api-client";

export const documentsService = {
  async list() {
    const { data } = await apiClient.get("/documents");
    return data;
  },

  async create(title: string) {
    const { data } = await apiClient.post("/documents", { title });
    return data;
  },

  async getOne(id: string) {
    const { data } = await apiClient.get(`/documents/${id}`);
    return data;
  },

  async update(id: string, title: string) {
    const { data } = await apiClient.patch(`/documents/${id}`, { title });
    return data;
  },

  async remove(id: string) {
    await apiClient.delete(`/documents/${id}`);
  },
};

export const syncService = {
   async push(docId: string, payload: { 
    clientId: string; 
    seq: number; 
    update: string 
  }) {
    try {
      const { data } = await apiClient.post(`/documents/${docId}/sync/push`, payload);
      return data;
    } catch (error: any) {
      console.error("Sync Push Failed:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  async pull(docId: string, stateVector?: string) {
    try {
      const { data } = await apiClient.get(`/documents/${docId}/sync/pull`, {
        params: { stateVector },
      });
      return data;
    } catch (error: any) {
      console.error("Sync Pull Failed:", error.response?.data || error.message);
      throw error;
    }
  },
};