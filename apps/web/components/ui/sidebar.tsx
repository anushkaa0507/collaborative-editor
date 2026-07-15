"use client";

import { useState } from "react";
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

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/") return null;

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
      <aside className="hidden md:flex w-20 shrink-0 sticky top-0 h-screen bg-white border-r border-outline flex-col items-center py-6 z-50">
        <Link href="/" title="CollabDoc">
          <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-white">
            <DocIcon className="w-6 h-6" />
          </div>
        </Link>
      </aside>
    );
  }

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-outline flex items-center justify-between px-4 z-50">
        <Link href="/documents" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
            <DocIcon className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-ink">CollabDoc</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-gray-500 hover:text-ink rounded-xl hover:bg-surface-alt"
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>
      </header>

      <div className={`md:hidden fixed inset-0 z-[70] ${mobileOpen ? "" : "pointer-events-none"}`}>
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute top-0 left-0 h-full w-72 max-w-[80%] bg-white shadow-2xl transition-transform duration-300 flex flex-col px-5 py-6 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-8">
            <Link href="/documents" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
                <DocIcon className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-ink">CollabDoc</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="text-gray-400 hover:text-ink text-2xl leading-none"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            <Link
              href="/documents"
              onClick={() => setMobileOpen(false)}
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
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:bg-surface-alt hover:text-ink transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                {initial}
              </div>
              <span className="truncate">{user.name || user.email}</span>
            </button>
          )}
        </div>
      </div>

      <aside className="hidden md:flex w-64 shrink-0 sticky top-0 h-screen bg-white border-r border-outline flex-col px-5 py-6 z-50">
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
    </>
  );
}