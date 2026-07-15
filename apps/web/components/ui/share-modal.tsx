"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useToast } from "@/components/ui/toast";
import { collaboratorsService, type Collaborator, type CollaboratorRole } from "@/lib/api/collaborators-service";

type ShareModalProps = {
  open: boolean;
  documentId: string;
  isOwner: boolean;
  onClose: () => void;
};

export function ShareModal({ open, documentId, isOwner, onClose }: ShareModalProps) {
  const { showSuccess, showError } = useToast();

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("EDITOR");
  const [adding, setAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    collaboratorsService
      .list(documentId)
      .then(setCollaborators)
      .catch((err: any) => showError(err.response?.data?.message || "Could not load collaborators"))
      .finally(() => setLoading(false));
  }, [open, documentId, showError]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    try {
      const collaborator = await collaboratorsService.add(documentId, email.trim(), role);
      setCollaborators((prev) => [...prev, collaborator]);
      setEmail("");
      showSuccess("Collaborator added");
    } catch (err: any) {
      showError(err.response?.data?.message || "Could not add collaborator");
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (collaboratorId: string, newRole: CollaboratorRole) => {
    setUpdatingId(collaboratorId);
    try {
      const updated = await collaboratorsService.updateRole(documentId, collaboratorId, newRole);
      setCollaborators((prev) => prev.map((c) => (c.id === collaboratorId ? updated : c)));
      showSuccess("Role updated");
    } catch (err: any) {
      showError(err.response?.data?.message || "Could not update role");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (collaboratorId: string) => {
    setRemovingId(collaboratorId);
    try {
      await collaboratorsService.remove(documentId, collaboratorId);
      setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
      showSuccess("Collaborator removed");
    } catch (err: any) {
      showError(err.response?.data?.message || "Could not remove collaborator");
    } finally {
      setRemovingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-ink">Share document</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-ink text-2xl leading-none">
            ×
          </button>
        </div>

        {isOwner && (
          <form onSubmit={handleAdd} className="flex gap-2 mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 border border-outline focus:border-primary rounded-2xl px-4 py-3 text-sm outline-none"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CollaboratorRole)}
              className="border border-outline rounded-2xl px-3 py-3 text-sm outline-none bg-white"
            >
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={adding || !email.trim()}
              className="bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-2xl text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </form>
        )}

        <div className="flex-1 overflow-auto -mx-2 px-2">
          {loading ? (
            <div className="py-8 text-center text-gray-500 text-sm">Loading collaborators...</div>
          ) : collaborators.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">No collaborators yet</div>
          ) : (
            <div className="space-y-2">
              {collaborators.map((c) => (
                <div key={c.id} className="flex items-center justify-between border border-outline rounded-2xl px-4 py-3">
                  <div>
                    <p className="font-medium text-ink text-sm">{c.user.name}</p>
                    <p className="text-xs text-gray-500">{c.user.email}</p>
                  </div>
                  {isOwner ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={c.role}
                        onChange={(e) => handleRoleChange(c.id, e.target.value as CollaboratorRole)}
                        disabled={updatingId === c.id}
                        className="border border-outline rounded-xl px-2 py-1.5 text-xs outline-none bg-white disabled:opacity-50"
                      >
                        <option value="EDITOR">Editor</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleRemove(c.id)}
                        disabled={removingId === c.id}
                        className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl disabled:opacity-50"
                      >
                        {removingId === c.id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{c.role}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}