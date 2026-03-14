"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

/** Per-user OAuth access token for Commons. When set, save-captions uses it instead of server-side owner-only token. */
export interface AuthContextValue {
  /** Current user's OAuth access token, or null if not logged in / using owner-only mode. */
  accessToken: string | null;
  /** Set the token (e.g. after OAuth callback). Pass null to clear. */
  setAccessToken: (token: string | null) => void;
  /** True when the user has provided a token (per-user mode). */
  isPerUserMode: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const setAccessToken = useCallback((token: string | null) => {
    setAccessTokenState(token);
  }, []);
  const value: AuthContextValue = {
    accessToken,
    setAccessToken,
    isPerUserMode: accessToken != null && accessToken.length > 0,
  };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
