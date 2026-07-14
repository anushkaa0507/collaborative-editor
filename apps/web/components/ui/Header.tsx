import Link from "next/link";
import { DocIcon } from "@/components/ui/doc-icon";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-outline bg-white flex items-center justify-between px-6">
      <Link href="/" className="flex items-center gap-2">
        <DocIcon className="w-7 h-7 text-primary" />
        <span className="text-primary font-extrabold text-xl tracking-tight">
          CollabDoc
        </span>
      </Link>
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
        <span className="text-primary font-semibold">Documents</span>
        <span>Version History</span>
        <span>Collaborators</span>
      </nav>
    </header>
  );
}