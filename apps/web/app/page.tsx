"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth/auth-context";
import { DocIcon } from "@/components/ui/doc-icon";

type Mode = "signin" | "signup";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login, register } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <main className="min-h-screen flex flex-col bg-gradient-to-br from-surface via-surface-alt to-white overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
          <div className="flex items-center gap-2">
            <DocIcon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            <span className="text-primary font-extrabold text-lg sm:text-xl tracking-tight">CollabDoc</span>
          </div>
        </div>

        <div className="flex-1 flex items-center container mx-auto px-4 sm:px-6 py-10 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center w-full">
            <div className="space-y-6 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-surface-alt text-primary px-4 py-1 rounded-full border border-primary/10">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs uppercase font-bold tracking-widest">
                  Offline-First Sync Engine
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-ink">
                Write anywhere. <span className="text-primary italic">Sync</span>{" "}
                everywhere.
              </h1>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                A local-first, collaborative document editor with deterministic
                conflict resolution, granular version history, and real-time
                sync that never blocks your UI — even offline.
              </p>

           <div className="relative">
  <div className="pointer-events-none absolute -inset-x-8 -inset-y-10 -z-10">
    <div className="absolute top-0 left-4 w-40 h-40 rounded-full bg-primary/20 blur-3xl animate-breathe" />
    <div
      className="absolute bottom-4 right-0 w-56 h-56 rounded-full bg-primary/15 blur-3xl animate-breathe"
      style={{ animationDelay: "1.5s" }}
    />
    <div
      className="absolute top-10 right-10 w-6 h-6 rounded-full bg-primary/30 blur-sm animate-float"
      style={{ animationDelay: "0.4s" }}
    />
    <div
      className="absolute bottom-16 left-2 w-4 h-4 rounded-full bg-primary/25 blur-sm animate-float"
      style={{ animationDelay: "2.2s" }}
    />
    <div
      className="absolute top-1/2 -left-4 w-3 h-3 rounded-full bg-primary/20 blur-sm animate-float"
      style={{ animationDelay: "3.6s" }}
    />
  </div>

  <div className="rounded-3xl border border-outline bg-white shadow-xl shadow-primary/5 overflow-hidden animate-float">
    <Image
      src="/screen.png"
      alt="CollabDoc editor preview"
      width={900}
      height={600}
      className="w-full h-auto object-contain"
      priority
    />
  </div>
</div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:gap-x-8 pt-6 border-t border-outline">
                <div>
                  <p className="text-primary font-bold text-sm">100%</p>
                  <p className="text-gray-500 text-xs">Offline First</p>
                </div>
                <div className="w-px h-8 bg-outline hidden sm:block" />
                <div>
                  <p className="text-primary font-bold text-sm">Auto</p>
                  <p className="text-gray-500 text-xs">Conflict Resolution</p>
                </div>
                <div className="w-px h-8 bg-outline hidden sm:block" />
                <div>
                  <p className="text-primary font-bold text-sm">Full</p>
                  <p className="text-gray-500 text-xs">Version Timeline</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-primary/10 border border-outline overflow-hidden">
                <div className="relative flex border-b border-outline">
                  <div
                    className={`absolute bottom-0 h-[3px] w-1/2 bg-primary transition-transform duration-300 ${
                      mode === "signup" ? "translate-x-full" : "translate-x-0"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className={`flex-1 py-4 sm:py-5 font-semibold text-center transition-colors ${
                      mode === "signin" ? "text-primary" : "text-gray-400 hover:text-ink"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className={`flex-1 py-4 sm:py-5 font-semibold text-center transition-colors ${
                      mode === "signup" ? "text-primary" : "text-gray-400 hover:text-ink"
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-5 sm:space-y-6">
                  {mode === "signup" && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Name</label>
                      <input
                        type="text"
                        placeholder="Jane Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full rounded-2xl border border-outline px-5 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Email</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-2xl border border-outline px-5 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full rounded-2xl border border-outline px-5 py-3.5 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-500 pt-2">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-semibold text-base transition-all active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed mt-4"
                  >
                    {submitting
                      ? "Please wait..."
                      : mode === "signin"
                      ? "Sign In"
                      : "Create Account"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-outline py-8">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p className="text-xs text-gray-400">
            Anushka Ramrakhya • Fullstack Developer Assignment
          </p>
          <div className="flex gap-6 text-xs text-gray-400">
            <a href="https://github.com/anushkaa0507" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">GitHub</a>
            <a href="https://www.linkedin.com/in/anushka-ramrakhya-58734b363/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}