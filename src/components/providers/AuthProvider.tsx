"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import type { User } from "@/types";

// ---------- Store externo para la sesión (localStorage) ----------
const listeners = new Set<() => void>();
let snapshot: User | null;
let primed = false;

function readUser(): User | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getUserSnapshot(): User | null {
  if (!primed) {
    primed = true;
    snapshot = readUser();
  }
  return snapshot;
}

function getServerSnapshot(): User | null {
  return null;
}

function commit(next: User | null, persist: boolean): void {
  if (persist) localStorage.setItem("user", JSON.stringify(next));
  snapshot = next;
  primed = true;
  for (const listener of listeners) listener();
}

// ---------- Contexto de acciones ----------
interface AuthContextValue {
  user: User | null;
  setSession: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribe, getUserSnapshot, getServerSnapshot);

  const setSession = useCallback((token: string, next: User) => {
    // Cookie (js-readable) compartida con el guard server-side (proxy.ts)
    document.cookie = `tb_token=${encodeURIComponent(
      token,
    )}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    commit(next, true);
  }, []);

  const updateUser = useCallback((next: User) => {
    commit(next, true);
  }, []);

  const logout = useCallback(() => {
    document.cookie = "tb_token=; path=/; max-age=0; SameSite=Lax";
    localStorage.removeItem("user");
    commit(null, false);
    window.location.href = "/login";
  }, []);

  const value = useMemo(
    () => ({ user, setSession, updateUser, logout }),
    [user, setSession, updateUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
