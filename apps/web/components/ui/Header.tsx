"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { DocIcon } from "@/components/ui/doc-icon";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const initial = user?.name 
    ? user.name.charAt(0).toUpperCase() 
    : user?.email 
    ? user.email.charAt(0).toUpperCase() 
    : "U";

  const handleLogout = async () => {
    await logout?.();
    router.replace("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-outline bg-white flex items-center justify-between px-6">
      <Link href="/" className="flex items-center gap-2">
        <DocIcon className="w-7 h-7 text-primary" />
        <span className="text-primary font-extrabold text-xl tracking-tight">
          CollabDoc
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
        <Link href="/documents" className="hover:text-ink transition-colors">Documents</Link>
        <Link href="/documents" className="hover:text-ink transition-colors">Version History</Link>
        <Link href="#" className="hover:text-ink transition-colors">Collaborators</Link>
      </nav>

      {isAuthenticated && user && (
        <div className="flex items-center gap-4">
          <div className="text-sm text-ink font-medium hidden md:block">
            {user.name || user.email}
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium px-5 py-2 rounded-2xl transition-all"
            title="Logout"
          >
            <span className="hidden sm:inline">Logout</span>
            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center text-xs font-bold">
              {initial}
            </div>
          </button>
        </div>
      )}
    </header>
  );
}