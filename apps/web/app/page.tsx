"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth/auth-context";

type Mode = "signin" | "signup";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login, register } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in - skip the login screen entirely.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/documents");
    }
  }, [isLoading, isAuthenticated, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      router.push("/documents");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  // Avoid flashing the form while we check for an existing session.
  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <main className="pt-16 min-h-screen flex items-center bg-gradient-to-br from-surface via-surface-alt to-white overflow-hidden">
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: value prop */}
            <div className="relative space-y-6 max-w-xl">
              {/* Subtle floating overlay of screen.png, sits behind the copy */}
              <div className="pointer-events-none absolute -top-20 -left-12 w-[420px] h-[420px] opacity-[0.08] animate-float select-none -z-10">
                <Image
                  src="/screen.png"
                  alt=""
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <div className="inline-flex items-center gap-2 bg-surface-alt text-primary px-4 py-1 rounded-full border border-primary/10">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs uppercase font-bold tracking-widest">
                  Offline-First Sync Engine
                </span>
              </div>

              <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
                Write anywhere. <span className="text-primary italic">Sync</span>{" "}
                everywhere.
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                A local-first, collaborative document editor with deterministic
                conflict resolution, granular version history, and real-time
                sync that never blocks your UI — even offline.
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

            {/* Right: auth card */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-outline overflow-hidden">
                <div className="flex border-b border-outline">
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
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
                    onClick={() => switchMode("signup")}
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
                      <input
                        type="text"
                        placeholder="Jane Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full rounded-lg border border-outline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-tight">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-lg border border-outline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-tight">
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-outline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? "Please wait..."
                      : mode === "signin"
                      ? "Sign In to Workspace"
                      : "Create Account"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-outline py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">
            Anushka • Fullstack Developer Assignment
          </p>
          <div className="flex gap-6 text-xs text-gray-400">
            <a href="#" className="hover:underline">
              GitHub
            </a>
            <a href="#" className="hover:underline">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-14px);
          }
        }
        .animate-float {
          animation: float 7s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}