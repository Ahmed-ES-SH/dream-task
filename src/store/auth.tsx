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
  finalizeLoginWithMfa,
  getAccessToken,
  loginRequest,
  logoutRequest,
  setAccessToken,
  setRefreshToken,
} from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { LoginRequest } from "@/types/auth";
import type { MfaLoginVerifyResponse } from "@/types/mfa";

export type LoginResult =
  | { status: "authenticated" }
  | { status: "mfa_required"; mfaToken: string };

type AuthContextValue = {
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<LoginResult>;
  completeLoginWithMfa: (result: MfaLoginVerifyResponse) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    Boolean(getAccessToken()),
  );

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

    return { status: "authenticated" };
  }, []);

  const completeLoginWithMfa = useCallback(
    async (result: MfaLoginVerifyResponse) => {
      // §11.5 handshake: store the returned tokens and, when the access token
      // is absent, mint one via the refresh path.
      await finalizeLoginWithMfa(result);
      setIsAuthenticated(true);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // The session is considered ended client-side regardless of the server response.
    } finally {
      clearAuthTokens();
      queryClient.removeQueries({ queryKey: ["profile"] });
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      clearAuthTokens();
      queryClient.removeQueries({ queryKey: ["profile"] });
      setIsAuthenticated(false);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);

    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, login, completeLoginWithMfa, logout }),
    [isAuthenticated, login, completeLoginWithMfa, logout],
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
