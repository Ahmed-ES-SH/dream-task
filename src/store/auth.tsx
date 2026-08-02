import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AUTH_UNAUTHORIZED_EVENT,
  clearAuthTokens,
  clearStoredMfaActive,
  finalizeLoginWithMfa,
  getAccessToken,
  getStoredMfaActive,
  loginRequest,
  logoutRequest,
  setAccessToken,
  setRefreshToken,
  setStoredMfaActive,
} from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { getMfaStatus } from "@/lib/profile";
import type { LoginRequest } from "@/types/auth";
import type { MfaLoginVerifyResponse } from "@/types/mfa";
import type { User } from "@/types/user";

export type LoginResult =
  | { status: "authenticated"; user: User | null }
  | { status: "mfa_required"; mfaToken: string };

type AuthContextValue = {
  isAuthenticated: boolean;
  // Last known MFA state for the current session. `null` = unknown (no
  // signal received yet, e.g. legacy session or response without MFA fields).
  mfaActive: boolean | null;
  login: (credentials: LoginRequest) => Promise<LoginResult>;
  completeLoginWithMfa: (result: MfaLoginVerifyResponse) => Promise<void>;
  updateMfaActive: (next: boolean | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    Boolean(getAccessToken()),
  );

  const [mfaActive, setMfaActive] = useState<boolean | null>(() =>
    getStoredMfaActive(),
  );

  const updateMfaActive = useCallback((next: boolean | null) => {
    setMfaActive(next);
    if (next === null) {
      clearStoredMfaActive();
    } else {
      setStoredMfaActive(next);
    }
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<LoginResult> => {
    const response = await loginRequest(credentials);

    if (response.mfaRequired) {
      if (!response.mfaToken) {
        throw new Error("MFA challenge missing token");
      }

      return { status: "mfa_required", mfaToken: response.mfaToken };
    }

    if (response.accessToken) {
      setAccessToken(response.accessToken);
    }

    if (response.refreshToken) {
      setRefreshToken(response.refreshToken);
    }

    setIsAuthenticated(true);

    // The login response may carry the user (with `mfa.enabled`/`mfa.verified`);
    // the caller uses it to decide the post-login destination: users without
    // MFA must be sent to settings, because /me requires a verified MFA
    // session. Persist the reported MFA state so the guard and the Security
    // card stay accurate across reloads.
    const mfaStatus = getMfaStatus(response.user);
    if (mfaStatus !== null) {
      updateMfaActive(mfaStatus);
    }

    return { status: "authenticated", user: response.user ?? null };
  }, [updateMfaActive]);

  const completeLoginWithMfa = useCallback(
    async (result: MfaLoginVerifyResponse) => {
      // §11.5 handshake: store the returned tokens and, when the access token
      // is absent, mint one via the refresh path. The challenge flow only
      // runs for MFA-enabled accounts, so the state is `verified` when the
      // response reports it, `true` otherwise.
      await finalizeLoginWithMfa(result);
      updateMfaActive(result.mfa?.verified ?? true);
      setIsAuthenticated(true);
    },
    [updateMfaActive],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // The session is considered ended client-side regardless of the server response.
    } finally {
      clearAuthTokens();
      clearStoredMfaActive();
      updateMfaActive(null);
      queryClient.removeQueries({ queryKey: ["profile"] });
      setIsAuthenticated(false);
    }
  }, [updateMfaActive]);

  useEffect(() => {
    const onUnauthorized = () => {
      clearAuthTokens();
      clearStoredMfaActive();
      updateMfaActive(null);
      queryClient.removeQueries({ queryKey: ["profile"] });
      setIsAuthenticated(false);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);

    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
  }, [updateMfaActive]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      mfaActive,
      login,
      completeLoginWithMfa,
      updateMfaActive,
      logout,
    }),
    [isAuthenticated, mfaActive, login, completeLoginWithMfa, updateMfaActive, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
