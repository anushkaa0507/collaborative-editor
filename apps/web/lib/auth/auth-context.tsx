"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/lib/api/auth.service";
import { readUserCache, writeUserCache, clearUserCache } from "@/app/documents/documents-cache";

type User = {
  id: string;
  name: string;
  email: string;
  [key: string]: unknown;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOfflineSession: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineSession, setIsOfflineSession] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await authService.me();
        if (!cancelled) {
          setUser(data);
          setIsOfflineSession(false);
          writeUserCache(data);
        }
      } catch (err: any) {
        const isNetworkError = !err?.response;
        const cached = readUserCache();
        if (isNetworkError && cached) {
          if (!cancelled) {
            setUser(cached as User);
            setIsOfflineSession(true);
          }
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          clearUserCache();
          if (!cancelled) setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    hydrateSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email: string, password: string) {
    const data = await authService.login(email, password);
    const nextUser = (data.user as User) ?? data;
    setUser(nextUser);
    setIsOfflineSession(false);
    writeUserCache(nextUser);
  }

  async function register(name: string, email: string, password: string) {
    const data = await authService.register(name, email, password);
    const nextUser = (data.user as User) ?? data;
    setUser(nextUser);
    setIsOfflineSession(false);
    writeUserCache(nextUser);
  }

  async function logout() {
    try {
      await authService.logout();
    } catch {}
    setUser(null);
    setIsOfflineSession(false);
    clearUserCache();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isOfflineSession,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}