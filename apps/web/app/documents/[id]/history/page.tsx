"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import apiClient from "@/api/api-client";

type Snapshot = {
  id: string;
  label?: string;
  createdAt: string;
  createdBy: string;
};

export default function DocumentHistoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !params?.id) return;

    const fetchHistory = async () => {
      try {
        const { data } = await apiClient.get(`/documents/${params.id}/snapshots`);
        setSnapshots(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isAuthenticated, params?.id]);

  const handleRestore = async (snapshotId: string) => {
    if (!confirm("Restore this version? Current changes will be overwritten.")) return;

    setRestoring(snapshotId);
    try {
      await apiClient.post(`/documents/${params.id}/snapshots/${snapshotId}/restore`);
      alert("Document restored successfully!");
      router.push(`/documents/${params.id}`);
    } catch (err) {
      alert("Failed to restore version");
    } finally {
      setRestoring(null);
    }
  };

  const createSnapshot = async () => {
    const label = prompt("Enter label for this snapshot (optional):");
    try {
      await apiClient.post(`/documents/${params.id}/snapshots`, { label });
      alert("Snapshot created!");
      window.location.reload();
    } catch (err) {
      alert("Failed to create snapshot");
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
            <p className="text-gray-500">Restore any previous version</p>
          </div>
          <button
            onClick={createSnapshot}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-semibold"
          >
            Create New Snapshot
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-outline overflow-hidden">
          {snapshots.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No snapshots yet. Create one to save important versions.
            </div>
          ) : (
            snapshots.map((snap) => (
              <div key={snap.id} className="border-b border-outline last:border-none p-6 flex items-center justify-between hover:bg-surface-alt">
                <div>
                  <p className="font-medium">{snap.label || "Untitled Snapshot"}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(snap.createdAt).toLocaleString()} • by {snap.createdBy}
                  </p>
                </div>
                <button
                  onClick={() => handleRestore(snap.id)}
                  disabled={restoring === snap.id}
                  className="bg-white border border-primary text-primary hover:bg-primary hover:text-white px-6 py-2 rounded-xl transition-all disabled:opacity-50"
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
    </div>
  );
}