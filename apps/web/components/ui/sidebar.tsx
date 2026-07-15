"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { DocIcon } from "@/components/ui/doc-icon";

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

  return (
    <aside className="w-20 shrink-0 sticky top-0 h-screen bg-white border-r border-outline flex flex-col items-center py-6 z-50">
      <Link href={isAuthenticated ? "/documents" : "/"} title="CollabDoc" className="mb-8">
        <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-white">
          <DocIcon className="w-6 h-6" />
        </div>
      </Link>

      {isAuthenticated && (
        <nav className="flex flex-col items-center gap-2">
          <Link
            href="/documents"
            title="Documents"
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              onDocuments ? "bg-surface-alt text-primary" : "text-gray-400 hover:bg-surface-alt hover:text-primary"
            }`}
          >
            <GridIcon />
          </Link>
        </nav>
      )}

      <div className="flex-1" />

      {isAuthenticated && user && (
        <button
          onClick={handleLogout}
          title="Logout"
          className="w-11 h-11 rounded-2xl bg-surface-alt hover:bg-primary text-primary hover:text-white font-semibold flex items-center justify-center transition-all"
        >
          {initial}
        </button>
      )}
    </aside>
  );
}