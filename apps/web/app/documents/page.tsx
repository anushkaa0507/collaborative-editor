"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { documentsService } from "@/lib/api/documents-service";
import { useToast } from "@/components/ui/toast";
import { CreateDocumentModal } from "@/components/ui/create-document-modal";
import { readDocumentsListCache, writeDocumentsListCache } from "@/app/documents/documents-cache";

type DocumentSummary = {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

type ViewMode = "grid" | "list";

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export default function DocumentsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [isOnline, setIsOnline] = useState(true);
  const [usingCache, setUsingCache] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    setLoadingDocs(true);
    documentsService
      .list()
      .then((data) => {
        if (!active) return;
        setDocuments(data);
        setUsingCache(false);
        writeDocumentsListCache(data);
      })
      .catch(() => {
        if (!active) return;
        const cached = readDocumentsListCache();
        if (cached.length > 0) {
          setDocuments(cached);
          setUsingCache(true);
        } else {
          showError("Could not load your documents");
        }
      })
      .finally(() => {
        if (active) setLoadingDocs(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, showError]);

  const filtered = useMemo(
    () => documents.filter((doc) => doc.title.toLowerCase().includes(query.toLowerCase())),
    [documents, query]
  );

  async function handleCreate(title: string, description: string) {
    setCreating(true);
    try {
      const doc = await documentsService.create(title, description);
      showSuccess("Document created");
      setShowCreateModal(false);
      router.push(`/documents/${doc.id}`);
    } catch {
      showError("Could not create the document");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    const target = documents.find((d) => d.id === id);
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    try {
      await documentsService.remove(id);
      showSuccess("Document deleted");
    } catch {
      showError("Could not delete the document");
      if (target) setDocuments((prev) => [...prev, target]);
    }
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-outline bg-white px-4 sm:px-8 py-3 sm:py-0 sm:h-16 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 sticky top-0 z-30">
        <div className="flex-1 sm:max-w-2xl order-1">
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface-alt border border-outline focus:border-primary rounded-3xl pl-12 py-3 text-sm focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-3 order-2">
          <div className={`flex items-center gap-1.5 px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium ${isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
            {isOnline ? "Online" : "Offline"}
          </div>

          <div className="flex items-center gap-2 bg-surface-alt rounded-3xl p-1">
            <button
              onClick={() => setView("grid")}
              className={`p-2.5 rounded-2xl transition-all ${view === "grid" ? "bg-white shadow text-primary" : "text-gray-400 hover:text-ink"}`}
            >
              <GridIcon />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2.5 rounded-2xl transition-all ${view === "list" ? "bg-white shadow text-primary" : "text-gray-400 hover:text-ink"}`}
            >
              <ListIcon />
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-ink">My Documents</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">{filtered.length} documents</div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-2xl px-4 sm:px-5 py-2.5 text-sm font-semibold transition-all active:scale-[0.985]"
            >
              <PlusIcon /> <span className="hidden xs:inline">New Document</span><span className="xs:hidden">New</span>
            </button>
          </div>
        </div>

        {usingCache && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 sm:px-5 py-3 rounded-2xl mb-6 text-sm">
            You're offline — showing the last saved copy of your documents. New changes will sync once you're back online.
          </div>
        )}

        {loadingDocs ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-60 bg-white border border-outline rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <div className="text-6xl mb-6 opacity-40">📄</div>
            <p className="text-xl sm:text-2xl font-medium text-ink mb-2">
              {query ? "No matching documents" : "No documents yet"}
            </p>
            <p className="text-gray-500 mb-8 max-w-xs">
              {query ? "Try different keywords" : "Create your first document to begin"}
            </p>
            {!query && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-2xl font-semibold transition-all"
              >
                Create New Document
              </button>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                onClick={() => router.push(`/documents/${doc.id}`)}
                className="group bg-white border border-outline hover:border-primary/30 rounded-3xl overflow-hidden transition-all hover:shadow-xl cursor-pointer"
              >
                <div className="h-44 sm:h-56 bg-surface-alt flex items-center justify-center relative">
                  <FileIcon />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                    className="absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 bg-white p-2 rounded-xl shadow hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <div className="p-4 sm:p-5">
                  <p className="font-medium text-ink line-clamp-2 mb-1.5">{doc.title}</p>
                  <p className="text-xs text-gray-500">{timeAgo(doc.updatedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-outline rounded-3xl overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 px-8 py-4 text-xs font-medium text-gray-500 border-b">
              <div className="col-span-6">Name</div>
              <div className="col-span-3">Last modified</div>
              <div className="col-span-2">Owner</div>
              <div className="col-span-1"></div>
            </div>
            {filtered.map((doc) => (
              <div
                key={doc.id}
                onClick={() => router.push(`/documents/${doc.id}`)}
                className="flex sm:grid sm:grid-cols-12 items-center px-4 sm:px-8 py-4 sm:py-5 border-b hover:bg-surface-alt cursor-pointer group gap-3 sm:gap-0"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 sm:col-span-6">
                  <FileIcon />
                  <div className="min-w-0">
                    <span className="font-medium text-ink block truncate">{doc.title}</span>
                    <span className="sm:hidden text-xs text-gray-500">{timeAgo(doc.updatedAt)}</span>
                  </div>
                </div>
                <div className="hidden sm:block sm:col-span-3 text-sm text-gray-500">{timeAgo(doc.updatedAt)}</div>
                <div className="hidden sm:block sm:col-span-2 text-sm text-gray-500">
                  {doc.ownerId === user?.id ? "You" : "Shared"}
                </div>
                <div className="sm:col-span-1 flex justify-end shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateDocumentModal
        open={showCreateModal}
        creating={creating}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}