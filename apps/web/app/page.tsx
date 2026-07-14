"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        await authService.login(email, password);
      } else {
        await authService.register(name, email, password);
      }
      router.push("/documents");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-outline bg-white flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="text-primary font-extrabold text-xl">CollabDoc</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
          <span className="text-primary font-semibold">Documents</span>
          <span>Version History</span>
          <span>Collaborators</span>
        </nav>
      </header>

      <main className="pt-16 min-h-screen flex items-center bg-gradient-to-br from-surface via-surface-alt to-white">
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-surface-alt text-primary px-4 py-1 rounded-full border border-primary/10">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs uppercase font-bold tracking-widest">Offline-First Sync Engine</span>
              </div>

              <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
                Write anywhere. <span className="text-primary italic">Sync</span> everywhere.
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                A local-first, collaborative document editor with deterministic conflict resolution,
                granular version history, and real-time sync that never blocks your UI —
                even offline.
              </p>

              <div className="flex items-center gap-8 pt-6 border-t border-outline">
                <div>
                  <p className="text-primary font-bold text-sm">100%</p>
                  <p className="text-gray-500 text-xs">Offline First</p>
                </div>
                <div className="w-px h-8 bg-outline" />
                <div>
                  <p className="text-primary font-bold text-sm">Auto</p>
                  <p className="text-gray-500 text-xs">Conflict Resolution</p>
                </div>
                <div className="w-px h-8 bg-outline" />
                <div>
                  <p className="text-primary font-bold text-sm">Full</p>
                  <p className="text-gray-500 text-xs">Version Timeline</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-outline overflow-hidden">
                <div className="flex border-b border-outline">
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className={`flex-1 py-4 font-semibold text-center transition-all ${
                      mode === "signin"
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-400"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={`flex-1 py-4 font-semibold text-center transition-all ${
                      mode === "signup"
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-400"
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                  {mode === "signup" && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-tight">
                        Name
                      </label>
                      <Input
                        placeholder="Jane Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-tight">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-tight">
                      Password
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <Button type="submit" disabled={loading}>
                    {loading
                      ? "Please wait..."
                      : mode === "signin"
                      ? "Sign In to Workspace"
                      : "Create Account"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-outline py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">Anushka • Fullstack Developer Assignment</p>
          <div className="flex gap-6 text-xs text-gray-400">
            <a href="#" className="hover:underline">GitHub</a>
            <a href="#" className="hover:underline">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}