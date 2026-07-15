"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import apiClient from "@/api/api-client";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Snapshot = {
  id: string;
  versionLabel: string;
  createdAt: string;
  createdById: string;
};

function shortId(id: string) {
  return id.slice(0, 8);
}

export default function DocumentHistoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [role, setRole] = useState<"OWNER" | "EDITOR" | "VIEWER" | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingRestoreId, setPendingRestoreId] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [labelError, setLabelError] = useState<string | null>(null);
  const [showLabelPrompt, setShowLabelPrompt] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!params?.id) return;
    try {
      const [{ data: snapshotData }, { data: docData }] = await Promise.all([
        apiClient.get(`/documents/${params.id}/snapshots`),
        apiClient.get(`/documents/${params.id}`),
      ]);
      setSnapshots(snapshotData);
      setRole(docData.role);
    } catch (err: any) {
      showError(err.response?.data?.message || "Could not load version history");
    } finally {
      setLoading(false);
    }
  }, [params?.id, showError]);

  useEffect(() => {
    if (!isAuthenticated || !params?.id) return;
    fetchHistory();
  }, [isAuthenticated, params?.id, fetchHistory]);

  const confirmRestore = async () => {
    if (!pendingRestoreId) return;
    setRestoring(pendingRestoreId);
    try {
      await apiClient.post(`/documents/${params.id}/snapshots/${pendingRestoreId}/restore`);
      showSuccess("Version restored");
      setPendingRestoreId(null);
      router.push(`/documents/${params.id}`);
    } catch (err: any) {
      showError(err.response?.data?.message || "Could not restore this version");
    } finally {
      setRestoring(null);
    }
  };

  const createSnapshot = async () => {
    const versionLabel = labelInput.trim();
    if (!versionLabel) {
      setLabelError("Give this version a label");
      return;
    }
    setSaving(true);
    setLabelError(null);
    try {
      await apiClient.post(`/documents/${params.id}/snapshots`, { versionLabel });
      showSuccess("Current version saved");
      setShowLabelPrompt(false);
      setLabelInput("");
      fetchHistory();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setLabelError("A snapshot with this label already exists");
      } else {
        showError(err.response?.data?.message || "Could not save this version");
        setShowLabelPrompt(false);
        setLabelInput("");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading history...</div>;
  }

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ink">Version History</h1>
            <p className="text-gray-500">Save checkpoints and restore any previous version</p>
          </div>
          <button
            onClick={() => setShowLabelPrompt(true)}
            disabled={role === "VIEWER"}
            title={role === "VIEWER" ? "Viewers can't save new versions" : undefined}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Current Version
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-outline overflow-hidden">
          {snapshots.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No snapshots yet. Save a version to create your first checkpoint.
            </div>
          ) : (
            snapshots.map((snap, i) => (
              <div key={snap.id} className="border-b border-outline last:border-none p-6 flex items-center justify-between hover:bg-surface-alt">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{snap.versionLabel}</p>
                    {i === 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Latest
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(snap.createdAt).toLocaleString()} • by{" "}
                    {snap.createdById === user?.id ? "You" : shortId(snap.createdById)}
                  </p>
                </div>
                <button
                  onClick={() => setPendingRestoreId(snap.id)}
                  disabled={restoring === snap.id || role === "VIEWER"}
                  title={role === "VIEWER" ? "Viewers can't restore versions" : undefined}
                  className="bg-white border border-primary text-primary hover:bg-primary hover:text-white px-6 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-primary"
                >
                  {restoring === snap.id ? "Restoring..." : "Restore"}
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={() => router.push(`/documents/${params.id}`)}
          className="mt-6 text-primary hover:underline"
        >
          ← Back to Editor
        </button>
      </div>

      {showLabelPrompt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-ink mb-2">Save current version</h3>
            <p className="text-sm text-gray-500 mb-4">
              This saves a snapshot of the document exactly as it is right now.
            </p>
            <input
              autoFocus
              type="text"
              value={labelInput}
              onChange={(e) => {
                setLabelInput(e.target.value);
                setLabelError(null);
              }}
              placeholder="Label, e.g. Before rewrite"
              className={`w-full border rounded-2xl px-5 py-3 mb-1 outline-none ${
                labelError ? "border-red-400" : "border-outline focus:border-primary"
              }`}
            />
            {labelError && <p className="text-xs text-red-600 mb-3">{labelError}</p>}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowLabelPrompt(false);
                  setLabelInput("");
                  setLabelError(null);
                }}
                disabled={saving}
                className="flex-1 py-3 border border-outline rounded-2xl font-medium hover:bg-surface-alt disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={createSnapshot}
                disabled={saving}
                className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-2xl font-semibold disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingRestoreId}
        title="Restore this version?"
        description="This replaces the current document for you and every collaborator. Anyone editing right now will see their unsaved changes overwritten."
        confirmLabel="Restore"
        danger
        loading={!!restoring}
        onConfirm={confirmRestore}
        onCancel={() => setPendingRestoreId(null)}
      />
    </div>
  );
}