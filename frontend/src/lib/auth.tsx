"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, ApiError, loadTokens, saveTokens, type Me } from "./api";

interface AuthState {
  ready: boolean;
  me: Me | null;
  authError: string | null;
  establishmentId: string | null;
  establishmentName: string | null;
  establishmentSlug: string | null;
  selectEstablishment: (establishmentId: string) => void;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (input: {
    email?: string;
    phone?: string;
    password: string;
    establishmentName: string;
    establishmentSlug: string;
    locale?: "fr" | "ar";
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);
const ESTABLISHMENT_KEY = "booking.establishmentId";

function storedEstablishmentId(): string | null {
  try {
    return typeof window === "undefined"
      ? null
      : window.localStorage.getItem(ESTABLISHMENT_KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedEstablishmentId, setSelectedEstablishmentId] =
    useState<string | null>(storedEstablishmentId);

  const refreshMe = useCallback(async () => {
    try {
      if (!loadTokens()) await api.refreshSession();
      setMe(await api.me());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setMe(null);
        saveTokens(null);
        setAuthError(null);
        return;
      }
      throw error;
    }
  }, []);

  useEffect(() => {
    void refreshMe()
      .catch((error: unknown) =>
        setAuthError(
          error instanceof Error
            ? error.message
            : "Impossible de vérifier la session.",
        ),
      )
      .finally(() => setReady(true));
  }, [refreshMe]);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const tokens = await api.login(identifier, password);
    saveTokens(tokens);
    setMe(await api.me());
    setAuthError(null);
  }, []);

  const signUp = useCallback(async (input: {
    email?: string;
    phone?: string;
    password: string;
    establishmentName: string;
    establishmentSlug: string;
    locale?: "fr" | "ar";
  }) => {
    const tokens = await api.register(input);
    saveTokens(tokens);
    setMe(await api.me());
    setAuthError(null);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* on révoque localement quoi qu'il arrive */
    }
    saveTokens(null);
    setMe(null);
    setAuthError(null);
  }, []);

  const primary = me?.memberships?.[0];
  const selected =
    me?.memberships?.find(
      (membership) =>
        membership.establishment.id === selectedEstablishmentId,
    ) ?? primary;
  const selectEstablishment = useCallback(
    (establishmentId: string) => {
      if (
        !me?.memberships.some(
          (membership) => membership.establishment.id === establishmentId,
        )
      ) {
        return;
      }
      setSelectedEstablishmentId(establishmentId);
      try {
        window.localStorage.setItem(ESTABLISHMENT_KEY, establishmentId);
      } catch {
        // The current selection still applies for this page session.
      }
    },
    [me],
  );

  const value: AuthState = {
    ready,
    me,
    authError,
    establishmentId: selected?.establishment.id ?? null,
    establishmentName: selected?.establishment.name ?? null,
    establishmentSlug: selected?.establishment.slug ?? null,
    selectEstablishment,
    signIn,
    signUp,
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
