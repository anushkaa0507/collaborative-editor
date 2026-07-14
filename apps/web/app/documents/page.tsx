"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { documentsService } from "@/lib/api/documents-service";

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
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    setLoadingDocs(true);
    documentsService
      .list()
      .then((data) => {
        if (active) setDocuments(data);
      })
      .catch(() => {
        if (active) setError("Could not load your documents");
      })
      .finally(() => {
        if (active) setLoadingDocs(false);
      });
    return () => { active = false; };
  }, [isAuthenticated]);

  const filtered = useMemo(
    () => documents.filter((doc) => doc.title.toLowerCase().includes(query.toLowerCase())),
    [documents, query]
  );

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const doc = await documentsService.create(newTitle.trim());
      router.push(`/documents/${doc.id}`);
    } catch {
      setError("Could not create the document");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    try {
      await documentsService.remove(id);
    } catch {
      setError("Could not delete the document");
      setDocuments((prev) => [...prev, documents.find(d => d.id === id)!].filter(Boolean));
    }
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const initial = (user?.name ?? user?.email ?? "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 border-r border-outline bg-white px-6 py-8 hidden lg:flex flex-col">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">C</div>
          <span className="text-2xl font-bold tracking-tighter text-ink">CollabDoc</span>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white rounded-2xl py-4 font-semibold transition-all active:scale-[0.985] w-full mb-8"
        >
          <PlusIcon /> New Document
        </button>

        <nav className="space-y-1">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-alt text-primary font-semibold">
            <div className="w-5 h-5 bg-primary rounded" />
            My Drive
          </div>
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        {/* Top Header - Always Visible */}
        <header className="h-16 border-b border-outline bg-white px-8 flex items-center gap-6 z-10">
          <div className="lg:hidden flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-bold">C</div>
            <span className="font-bold text-xl text-ink">CollabDoc</span>
          </div>

          <div className="flex-1 max-w-2xl">
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

          <button
            onClick={() => logout?.().then(() => router.replace("/"))}
            className="w-9 h-9 rounded-2xl bg-primary text-white font-semibold flex items-center justify-center hover:bg-primary-dark transition-all"
            title="Logout"
          >
            {initial}
          </button>
        </header>

        {/* Main Area */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-ink">My Documents</h2>
            <div className="text-sm text-gray-500">{filtered.length} documents</div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-2xl mb-6">{error}</div>}

          {loadingDocs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-60 bg-white border border-outline rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-6xl mb-6 opacity-40">📄</div>
              <p className="text-2xl font-medium text-ink mb-2">
                {query ? "No matching documents" : "No documents yet"}
              </p>
              <p className="text-gray-500 mb-8 max-w-xs">
                {query ? "Try different keywords" : "Create your first document to begin"}
              </p>
              {!query && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-2xl font-semibold transition-all"
                >
                  Create New Document
                </button>
              )}
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => router.push(`/documents/${doc.id}`)}
                  className="group bg-white border border-outline hover:border-primary/30 rounded-3xl overflow-hidden transition-all hover:shadow-xl cursor-pointer"
                >
                  <div className="h-56 bg-surface-alt flex items-center justify-center relative">
                    <FileIcon />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 bg-white p-2 rounded-xl shadow hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="p-5">
                    <p className="font-medium text-ink line-clamp-2 mb-1.5">{doc.title}</p>
                    <p className="text-xs text-gray-500">{timeAgo(doc.updatedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-outline rounded-3xl overflow-hidden">
              <div className="grid grid-cols-12 px-8 py-4 text-xs font-medium text-gray-500 border-b">
                <div className="col-span-6">Name</div>
                <div className="col-span-3">Last modified</div>
                <div className="col-span-2">Owner</div>
                <div className="col-span-1"></div>
              </div>
              {filtered.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => router.push(`/documents/${doc.id}`)}
                  className="grid grid-cols-12 px-8 py-5 items-center border-b hover:bg-surface-alt cursor-pointer group"
                >
                  <div className="col-span-6 flex items-center gap-4">
                    <FileIcon />
                    <span className="font-medium text-ink">{doc.title}</span>
                  </div>
                  <div className="col-span-3 text-sm text-gray-500">{timeAgo(doc.updatedAt)}</div>
                  <div className="col-span-2 text-sm text-gray-500">
                    {doc.ownerId === user?.id ? "You" : "Shared"}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-6 text-ink">New Document</h3>
            <form onSubmit={handleCreate}>
              <input
                type="text"
                autoFocus
                placeholder="Document title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border border-outline focus:border-primary rounded-2xl px-5 py-4 text-lg mb-6 outline-none"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setNewTitle(""); }}
                  className="flex-1 py-4 border border-outline rounded-2xl font-medium hover:bg-surface-alt"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="flex-1 py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-semibold disabled:opacity-50 transition-all"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}