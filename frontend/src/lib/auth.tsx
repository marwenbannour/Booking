"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, loadTokens, saveTokens, type Me } from "./api";

interface AuthState {
  ready: boolean;
  me: Me | null;
  establishmentId: string | null;
  establishmentName: string | null;
  establishmentSlug: string | null;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  const refreshMe = useCallback(async () => {
    if (!loadTokens()) {
      setMe(null);
      return;
    }
    try {
      setMe(await api.me());
    } catch {
      setMe(null);
      saveTokens(null);
    }
  }, []);

  useEffect(() => {
    void refreshMe().finally(() => setReady(true));
  }, [refreshMe]);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const tokens = await api.login(identifier, password);
    saveTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    setMe(await api.me());
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* on révoque localement quoi qu'il arrive */
    }
    saveTokens(null);
    setMe(null);
  }, []);

  const primary = me?.memberships?.[0];

  const value: AuthState = {
    ready,
    me,
    establishmentId: primary?.establishment.id ?? null,
    establishmentName: primary?.establishment.name ?? null,
    establishmentSlug: primary?.establishment.slug ?? null,
    signIn,
    signOut,
    refreshMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un <AuthProvider>");
  return ctx;
}
