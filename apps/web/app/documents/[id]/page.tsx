"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import * as Y from "yjs";
import apiClient from "@/api/api-client";
import { syncService } from "@/lib/api/documents-service";

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

export default function DocumentEditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { isAuthenticated, isLoading, user } = useAuth();

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;
        ytextRef.current = ydoc.getText("content");

        if (data.state) {
          Y.applyUpdate(ydoc, new Uint8Array(Buffer.from(data.state, "base64")));
        }

        updateEditorFromYjs();
        ytextRef.current.observe(updateEditorFromYjs);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load document");
      } finally {
        setLoading(false);
      }
    };

    loadDocument();

    return () => {
      if (ytextRef.current) ytextRef.current.unobserve(updateEditorFromYjs);
      if (ydocRef.current) ydocRef.current.destroy();
    };
  }, [isAuthenticated, params?.id, updateEditorFromYjs]);

  const syncWithServer = useCallback(async () => {
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
    } catch (err: any) {
      console.error("Sync Error:", err.response?.data || err.message);
    } finally {
      isSyncingRef.current = false;
      setIsSaving(false);
    }
  }, [params?.id, user?.id, doc?.role]);

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
      setDoc((prev) => prev ? { ...prev, title } : null);
    } catch {
      setTitle(doc.title);
    }
  };

  const handleEditorInput = () => {
    updateYjsFromEditor();
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(syncWithServer, 1000);
  };

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
        <button onClick={() => router.push("/documents")} className="text-gray-400 hover:text-ink text-xl">←</button>

        <input
          type="text"
          value={title}
          disabled={doc.role === "VIEWER"}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="flex-1 text-xl font-semibold bg-transparent focus:outline-none border-b-2 border-transparent focus:border-primary"
        />

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-4 py-1 rounded-full text-sm font-medium ${isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
            {isOnline ? "Online" : "Offline"}
          </div>

          {isSaving && <div className="text-sm text-primary font-medium">Saving...</div>}

          <div className="px-5 py-1.5 bg-surface-alt text-xs font-bold uppercase tracking-widest rounded-2xl text-primary">
            {doc.role}
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 flex justify-center overflow-auto">
        <div className="w-full max-w-4xl bg-white border border-outline rounded-3xl shadow-sm min-h-[700px] p-12">
          <div
            ref={editorRef}
            contentEditable={doc.role !== "VIEWER"}
            className="min-h-[580px] focus:outline-none text-lg leading-relaxed prose prose-neutral max-w-none"
            style={{ whiteSpace: "pre-wrap" }}
            onInput={handleEditorInput}
            onBlur={handleEditorInput}
          />
        </div>
      </main>

      <div className="fixed bottom-6 right-6 bg-white border border-outline rounded-2xl px-5 py-2.5 text-xs text-gray-500 shadow flex items-center gap-2 z-50">
        <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
        Local-first • Auto-save
      </div>
    </div>
  );
}