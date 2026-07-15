type CachedDocumentSummary = {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

type CachedDocumentDetail = {
  id: string;
  title: string;
  ownerId: string;
  state: string;
  stateVector: string;
  createdAt: string;
  updatedAt: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
};

const LIST_KEY = "collabdoc:documents-list";
const DOC_KEY_PREFIX = "collabdoc:document:";

export function readDocumentsListCache(): CachedDocumentSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeDocumentsListCache(documents: CachedDocumentSummary[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LIST_KEY, JSON.stringify(documents));
  } catch {}
}

export function readDocumentCache(id: string): CachedDocumentDetail | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DOC_KEY_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeDocumentCache(doc: CachedDocumentDetail) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DOC_KEY_PREFIX + doc.id, JSON.stringify(doc));
  } catch {}
}