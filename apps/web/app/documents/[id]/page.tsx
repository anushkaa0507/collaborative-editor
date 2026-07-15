"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import * as Y from "yjs";
import apiClient from "@/api/api-client";
import { syncService } from "@/lib/api/documents-service";
import { useToast } from "@/components/ui/toast";
import { readDocumentCache, writeDocumentCache } from "@/app/documents/documents-cache";
import { ShareModal } from "@/components/ui/share-modal";

type DocumentDetail = {
  id: string;
  title: string;
  ownerId: string;
  state: string;
  stateVector: string;
  createdAt: string;
  updatedAt: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
};

type UserPresence = {
  userId: string;
  name: string;
  color: string;
  lastActive: Date;
};

const COLORS = ["#4B2FD6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function DocumentEditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineCopy, setOfflineCopy] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);
  const isUpdatingRef = useRef(false);

  const updateEditorFromYjs = useCallback(() => {
    if (!editorRef.current || !ytextRef.current || isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    editorRef.current.textContent = ytextRef.current.toString();
    isUpdatingRef.current = false;
  }, []);

  const updateYjsFromEditor = useCallback(() => {
    if (!ytextRef.current || !editorRef.current || isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    const newText = editorRef.current.textContent || "";
    const currentText = ytextRef.current.toString();
    if (newText !== currentText) {
      ytextRef.current.delete(0, currentText.length);
      ytextRef.current.insert(0, newText);
    }
    isUpdatingRef.current = false;
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !params?.id) return;

    const loadDocument = async () => {
      try {
        const { data } = await apiClient.get(`/documents/${params.id}`);
        setDoc(data);
        setTitle(data.title);
        setOfflineCopy(false);
        writeDocumentCache(data);
        initYjs(data);
      } catch (err: any) {
        const cached = readDocumentCache(params.id);
        if (cached) {
          setDoc(cached);
          setTitle(cached.title);
          setOfflineCopy(true);
          initYjs(cached);
        } else {
          setError(err.response?.data?.message || "Failed to load document");
        }
      } finally {
        setLoading(false);
      }
    };

    const initYjs = (data: DocumentDetail) => {
      const ydoc = new Y.Doc();
      ydocRef.current = ydoc;
      ytextRef.current = ydoc.getText("content");
      if (data.state) {
        Y.applyUpdate(ydoc, new Uint8Array(Buffer.from(data.state, "base64")));
      }
      updateEditorFromYjs();
      ytextRef.current.observe(updateEditorFromYjs);
    };

    loadDocument();

    return () => {
      if (ytextRef.current) ytextRef.current.unobserve(updateEditorFromYjs);
      if (ydocRef.current) ydocRef.current.destroy();
    };
  }, [isAuthenticated, params?.id, updateEditorFromYjs]);

  const syncWithServer = useCallback(
    async (opts?: { announce?: boolean }) => {
      if (!ydocRef.current || !params?.id || isSyncingRef.current || doc?.role === "VIEWER") return;

      isSyncingRef.current = true;
      setIsSaving(true);
      try {
        const ydoc = ydocRef.current;
        const update = Y.encodeStateAsUpdate(ydoc);
        const stateVector = Y.encodeStateVector(ydoc);

        const clientId = user?.id || crypto.randomUUID();
        const seq = Math.floor(Date.now() % 1000000000);

        await syncService.push(params.id, {
          clientId,
          seq,
          update: Buffer.from(update).toString("base64"),
        });

        const pullData = await syncService.pull(params.id, Buffer.from(stateVector).toString("base64"));

        if (pullData?.update) {
          Y.applyUpdate(ydoc, new Uint8Array(Buffer.from(pullData.update, "base64")));
        }

        setLastSynced(new Date());
        setOfflineCopy(false);
        if (opts?.announce) showSuccess("Changes saved");
      } catch (err: any) {
        if (opts?.announce) showError("Could not save changes right now");
      } finally {
        isSyncingRef.current = false;
        setIsSaving(false);
      }
    },
    [params?.id, user?.id, doc?.role, showSuccess, showError]
  );

  useEffect(() => {
    if (!params?.id) return;
    syncIntervalRef.current = setInterval(() => {
      if (isOnline) syncWithServer();
    }, 8000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncWithServer, params?.id, isOnline]);

  const handleTitleBlur = async () => {
    if (!doc || title === doc.title || doc.role === "VIEWER") return;
    try {
      await apiClient.patch(`/documents/${doc.id}`, { title });
      setDoc((prev) => (prev ? { ...prev, title } : null));
    } catch {
      showError("Could not rename the document");
      setTitle(doc.title);
    }
  };

  const handleEditorInput = () => {
    updateYjsFromEditor();
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => syncWithServer(), 1000);
  };

  const handleManualSave = () => {
    syncWithServer({ announce: true });
  };

  const handleDownload = () => {
    const content = ytextRef.current?.toString() || "";
    const blob = new Blob([`${title}\n\n${content}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title || "document"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess("Document downloaded");
  };

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      setPresences([
        { userId: user.id, name: user.name || user.email.split("@")[0], color: COLORS[0], lastActive: new Date() },
      ]);
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-6">
        <p className="text-xl text-ink">{error || "Document not found"}</p>
        <button onClick={() => router.push("/documents")} className="text-primary font-semibold hover:underline">
          ← Back to Documents
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="h-16 border-b border-outline bg-white flex items-center px-8 gap-6 z-50 sticky top-0">
        <button onClick={() => router.push("/documents")} className="text-gray-400 hover:text-ink text-xl">
          ←
        </button>

        <input
          type="text"
          value={title}
          disabled={doc.role === "VIEWER"}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="flex-1 text-4xl font-bold bg-transparent focus:outline-none placeholder:text-gray-400"
          placeholder="Untitled Document"
        />

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-4 py-1 rounded-full text-sm font-medium ${isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
            {isOnline ? "Online" : "Offline"}
          </div>

          {isSaving && <div className="text-sm text-primary font-medium">Saving...</div>}

          {doc.role !== "VIEWER" && (
            <button
              onClick={handleManualSave}
              disabled={isSaving || !isOnline}
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
            >
              Update changes
            </button>
          )}

          <button
            onClick={() => setShowShareModal(true)}
            className="border border-outline hover:bg-surface-alt px-5 py-2 rounded-xl text-sm font-semibold transition-all"
          >
            Share
          </button>

          <button
            onClick={handleDownload}
            className="border border-outline hover:bg-surface-alt px-5 py-2 rounded-xl text-sm font-semibold transition-all"
          >
            Download
          </button>

          <button
            onClick={() => router.push(`/documents/${doc.id}/history`)}
            className="border border-outline hover:bg-surface-alt px-5 py-2 rounded-xl text-sm font-semibold transition-all"
          >
            History
          </button>

          <div className="px-5 py-1.5 bg-surface-alt text-xs font-bold uppercase tracking-widest rounded-2xl text-primary">
            {doc.role}
          </div>
        </div>
      </header>

      {offlineCopy && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-700 px-8 py-2 text-sm text-center">
          You're viewing an offline copy from your last visit. Changes will sync once you're back online.
        </div>
      )}

      <main className="flex-1 p-8 flex justify-center overflow-auto">
        <div className="w-full max-w-4xl">
          <div className="mb-8">
            <input
              type="text"
              value={title}
              disabled={doc.role === "VIEWER"}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full text-5xl font-bold bg-transparent focus:outline-none border-b-2 border-transparent focus:border-primary placeholder:text-gray-300"
              placeholder="Untitled Document"
            />
            <p className="text-sm text-gray-500 mt-1">
              {lastSynced ? `Last synced ${lastSynced.toLocaleTimeString()}` : "Not synced yet"}
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            {presences.map((p, i) => (
              <div key={i} className="flex items-center gap-2 bg-white border border-outline rounded-2xl px-4 py-1.5 text-sm">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: p.color }}>
                  {p.name[0].toUpperCase()}
                </div>
                <span className="text-gray-700">{p.name}</span>
                <span className="text-green-500 text-xs">●</span>
              </div>
            ))}
          </div>

          <div className="bg-white border border-outline rounded-3xl shadow-sm min-h-[700px] p-12">
            <div
              ref={editorRef}
              contentEditable={doc.role !== "VIEWER"}
              className="min-h-[580px] focus:outline-none text-[17px] leading-[1.85] text-gray-700 prose prose-neutral max-w-none"
              style={{ whiteSpace: "pre-wrap" }}
              onInput={handleEditorInput}
              onBlur={handleEditorInput}
            />
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6 bg-white border border-outline rounded-2xl px-5 py-2.5 text-xs text-gray-500 shadow flex items-center gap-2 z-50">
        <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
        Local-first • Auto-save
      </div>

      <ShareModal
        open={showShareModal}
        documentId={doc.id}
        isOwner={doc.role === "OWNER"}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}