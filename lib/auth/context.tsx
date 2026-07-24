"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/types";
import { seedData } from "@/lib/store";

const AUTH_KEY = "inegosyo_user";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => void;
  signup: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(AUTH_KEY) : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const persist = (u: User) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
    seedData(u.id);
  };

  const login = (email: string) => {
    const u: User = { id: self.crypto.randomUUID(), email, created_at: new Date().toISOString() };
    persist(u);
    router.push("/dashboard");
  };

  const signup = (email: string) => {
    login(email);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    router.push("/login");
  };

  return <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) return null;
  return <>{children}</>;
}
