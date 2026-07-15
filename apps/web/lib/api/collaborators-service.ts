import apiClient from "@/api/api-client";

export type CollaboratorRole = "EDITOR" | "VIEWER";

export type Collaborator = {
  id: string;
  documentId: string;
  userId: string;
  role: CollaboratorRole;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
};

export const collaboratorsService = {
  async list(documentId: string): Promise<Collaborator[]> {
    const { data } = await apiClient.get(`/documents/${documentId}/collaborators`);
    return data;
  },

  async add(documentId: string, email: string, role: CollaboratorRole): Promise<Collaborator> {
    const { data } = await apiClient.post(`/documents/${documentId}/collaborators`, { email, role });
    return data;
  },

  async updateRole(documentId: string, collaboratorId: string, role: CollaboratorRole): Promise<Collaborator> {
    const { data } = await apiClient.patch(`/documents/${documentId}/collaborators/${collaboratorId}`, { role });
    return data;
  },

  async remove(documentId: string, collaboratorId: string): Promise<void> {
    await apiClient.delete(`/documents/${documentId}/collaborators/${collaboratorId}`);
  },
};