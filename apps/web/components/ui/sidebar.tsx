"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { DocIcon } from "@/components/ui/doc-icon";

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  const initial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : "U";

  const onDocuments = pathname?.startsWith("/documents");

  const handleLogout = async () => {
    await logout?.();
    router.replace("/");
  };

  if (!isAuthenticated) {
    return (
      <aside className="w-20 shrink-0 sticky top-0 h-screen bg-white border-r border-outline flex flex-col items-center py-6 z-50">
        <Link href="/" title="CollabDoc">
          <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-white">
            <DocIcon className="w-6 h-6" />
          </div>
        </Link>
      </aside>
    );
  }

  return (
    <aside className="w-64 shrink-0 sticky top-0 h-screen bg-white border-r border-outline flex flex-col px-5 py-6 z-50">
      <Link href="/documents" className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
          <DocIcon className="w-5 h-5" />
        </div>
        <span className="text-lg font-bold tracking-tight text-ink">CollabDoc</span>
      </Link>

      <nav className="flex flex-col gap-1">
        <Link
          href="/documents"
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all ${
            onDocuments ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-surface-alt hover:text-ink"
          }`}
        >
          <GridIcon />
          My Drive
        </Link>
      </nav>

      <div className="flex-1" />

      {user && (
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:bg-surface-alt hover:text-ink transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
            {initial}
          </div>
          <span className="truncate">{user.name || user.email}</span>
        </button>
      )}
    </aside>
  );
}