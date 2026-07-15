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

type AiAction = "summarize" | "fix_grammar" | "continue_writing";

const AI_ACTIONS: { action: AiAction; label: string; description: string }[] = [
  { action: "summarize", label: "Summarize", description: "3-5 bullet points" },
  { action: "fix_grammar", label: "Fix grammar", description: "Corrects spelling & punctuation" },
  { action: "continue_writing", label: "Continue writing", description: "Adds 2-3 new paragraphs" },
];

const COLORS = ["#4B2FD6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

function AiSparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5c.35 0 .65.24.73.58l1.13 4.7 4.7 1.13a.75.75 0 0 1 0 1.46l-4.7 1.13-1.13 4.7a.75.75 0 0 1-1.46 0l-1.13-4.7-4.7-1.13a.75.75 0 0 1 0-1.46l4.7-1.13 1.13-4.7c.08-.34.38-.58.73-.58Z" />
      <path d="M18.5 15c.24 0 .45.16.5.4l.35 1.5 1.5.35a.5.5 0 0 1 0 .98l-1.5.35-.35 1.5a.5.5 0 0 1-.98 0l-.35-1.5-1.5-.35a.5.5 0 0 1 0-.98l1.5-.35.35-1.5a.5.5 0 0 1 .48-.4Z" />
    </svg>
  );
}

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

  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState<AiAction | null>(null);
  const [aiResult, setAiResult] = useState<{ action: AiAction; text: string } | null>(null);

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

  
  useEffect(() => {
    if (!loading) {
      updateEditorFromYjs();
    }
  }, [loading, updateEditorFromYjs]);

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

  const runAiAction = async (action: AiAction) => {
    setAiMenuOpen(false);
    if (!doc || !ytextRef.current) return;
    const text = ytextRef.current.toString();
    if (!text.trim()) {
      showError("Document is empty — write something first");
      return;
    }
    setAiLoading(action);
    try {
      const { data } = await apiClient.post(`/documents/${doc.id}/assist`, { action, text });
      setAiResult({ action, text: data.result });
    } catch (err: any) {
      showError(err.response?.data?.message || "AI assist failed");
    } finally {
      setAiLoading(null);
    }
  };

  const applyAiResult = (mode: "replace" | "insert") => {
    if (!aiResult || !ytextRef.current) return;
    isUpdatingRef.current = true;
    if (mode === "replace") {
      const len = ytextRef.current.toString().length;
      ytextRef.current.delete(0, len);
      ytextRef.current.insert(0, aiResult.text);
    } else {
      const len = ytextRef.current.toString().length;
      const separator = len > 0 ? "\n\n" : "";
      ytextRef.current.insert(len, `${separator}${aiResult.text}`);
    }
    isUpdatingRef.current = false;
    updateEditorFromYjs();
    setAiResult(null);
    syncWithServer({ announce: true });
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-6 px-4 text-center">
        <p className="text-xl text-ink">{error || "Document not found"}</p>
        <button onClick={() => router.push("/documents")} className="text-primary font-semibold hover:underline">
          ← Back to Documents
        </button>
      </div>
    );
  }

  const aiDisabled = doc.role === "VIEWER" || !!aiLoading;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="border-b border-outline bg-white flex flex-wrap items-center px-4 sm:px-8 py-3 sm:py-0 sm:h-16 gap-3 sm:gap-6 z-40 sticky top-0">
        <button onClick={() => router.push("/documents")} className="text-gray-400 hover:text-ink text-xl">
          ←
        </button>

        <input
          type="text"
          value={title}
          disabled={doc.role === "VIEWER"}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="hidden sm:block flex-1 text-4xl font-bold bg-transparent focus:outline-none placeholder:text-gray-400 min-w-0"
          placeholder="Untitled Document"
        />

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
          <div className={`flex items-center gap-1.5 px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium ${isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
            {isOnline ? "Online" : "Offline"}
          </div>

          {isSaving && <div className="text-sm text-primary font-medium">Saving...</div>}

          {doc.role !== "VIEWER" && (
            <button
              onClick={handleManualSave}
              disabled={isSaving || !isOnline}
              className="bg-primary hover:bg-primary-dark text-white px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50 transition-all"
            >
              Update changes
            </button>
          )}

          {doc.role !== "VIEWER" && (
            <div className="relative">
              <button
                onClick={() => setAiMenuOpen((v) => !v)}
                disabled={aiDisabled}
                className="bg-white border border-primary text-primary hover:bg-primary hover:text-white px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {aiLoading ? "Thinking..." : "✨ AI Assist"}
              </button>

              {aiMenuOpen && !aiDisabled && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAiMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-outline rounded-2xl shadow-xl z-50 overflow-hidden">
                    {AI_ACTIONS.map((item) => (
                      <button
                        key={item.action}
                        onClick={() => runAiAction(item.action)}
                        className="w-full text-left px-5 py-3 hover:bg-surface-alt transition-all border-b border-outline last:border-none"
                      >
                        <p className="font-medium text-ink text-sm">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={() => setShowShareModal(true)}
            className="border border-outline hover:bg-surface-alt px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all"
          >
            Share
          </button>

          <button
            onClick={handleDownload}
            className="border border-outline hover:bg-surface-alt px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all"
          >
            Download
          </button>

          <button
            onClick={() => router.push(`/documents/${doc.id}/history`)}
            className="border border-outline hover:bg-surface-alt px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all"
          >
            History
          </button>

          <div className="px-3 sm:px-5 py-1.5 bg-surface-alt text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-2xl text-primary">
            {doc.role}
          </div>
        </div>
      </header>

      {offlineCopy && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-700 px-4 sm:px-8 py-2 text-sm text-center">
          You're viewing an offline copy from your last visit. Changes will sync once you're back online.
        </div>
      )}

      <main className="flex-1 p-4 sm:p-8 flex justify-center overflow-auto">
        <div className="w-full max-w-4xl">
          <div className="mb-6 sm:mb-8">
            <input
              type="text"
              value={title}
              disabled={doc.role === "VIEWER"}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full text-3xl sm:text-5xl font-bold bg-transparent focus:outline-none border-b-2 border-transparent focus:border-primary placeholder:text-gray-300"
              placeholder="Untitled Document"
            />
            <p className="text-sm text-gray-500 mt-1">
              {lastSynced ? `Last synced ${lastSynced.toLocaleTimeString()}` : "Not synced yet"}
            </p>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
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

          <div className="bg-white border border-outline rounded-3xl shadow-sm min-h-[500px] sm:min-h-[700px] p-6 sm:p-12">
            <div
              ref={editorRef}
              contentEditable={doc.role !== "VIEWER"}
              className="min-h-[420px] sm:min-h-[580px] focus:outline-none text-[16px] sm:text-[17px] leading-[1.85] text-gray-700 prose prose-neutral max-w-none"
              style={{ whiteSpace: "pre-wrap" }}
              onInput={handleEditorInput}
              onBlur={handleEditorInput}
            />
          </div>
        </div>
      </main>

      <div className="hidden sm:flex fixed bottom-6 right-6 bg-white border border-outline rounded-2xl px-5 py-2.5 text-xs text-gray-500 shadow items-center gap-2 z-50">
        <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
        Local-first • Auto-save
      </div>

      {aiResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-outline">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <AiSparkleIcon />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink">
                    {AI_ACTIONS.find((a) => a.action === aiResult.action)?.label}
                  </h3>
                  <p className="text-xs text-gray-500">AI generated result</p>
                </div>
              </div>
              <button
                onClick={() => setAiResult(null)}
                className="text-gray-400 hover:text-ink text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-auto px-4 sm:px-8 py-6">
              <div className="bg-surface-alt rounded-2xl px-4 sm:px-6 py-5 text-sm text-ink whitespace-pre-wrap leading-relaxed">
                {aiResult.text}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 px-4 sm:px-8 py-4 sm:py-6 border-t border-outline">
              <button
                onClick={() => setAiResult(null)}
                className="flex-1 py-3 border border-outline rounded-2xl font-medium hover:bg-surface-alt transition-all"
              >
                Discard
              </button>
              {aiResult.action !== "fix_grammar" && (
                <button
                  onClick={() => applyAiResult("insert")}
                  className="flex-1 py-3 border border-primary text-primary rounded-2xl font-semibold hover:bg-primary hover:text-white transition-all"
                >
                  Insert at end
                </button>
              )}
              <button
                onClick={() => applyAiResult("replace")}
                className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-2xl font-semibold transition-all"
              >
                Replace document
              </button>
            </div>
          </div>
        </div>
      )}

      <ShareModal
        open={showShareModal}
        documentId={doc.id}
        isOwner={doc.role === "OWNER"}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}