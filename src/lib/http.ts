import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { AUTH_API } from "@/constants/auth.api";
import type { MfaLoginVerifyResponse } from "@/types/mfa";

import { pickString, unwrapPayload, type Payload } from "./payload";

// Tokens persist in localStorage for sync access by interceptors.
export const TOKEN_STORAGE_KEY = "access_token";
export const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";

// Dispatched when the session dies; AuthProvider listens to sign the user out.
export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

// Backend API base URL (see .env.example for VITE_API_BASE_URL).
const baseURL = "/api" as string | undefined;

// ---- Token helpers -----------------------------------------------------

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function setRefreshToken(token: string | null): void {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}

export function clearAuthTokens(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

// /me lacks MFA state, so persist the last known value for MfaGuard.
export const MFA_ACTIVE_STORAGE_KEY = "mfa_active";

export function getStoredMfaActive(): boolean | null {
  const raw = localStorage.getItem(MFA_ACTIVE_STORAGE_KEY);
  return raw === "true" ? true : raw === "false" ? false : null;
}

export function setStoredMfaActive(active: boolean): void {
  localStorage.setItem(MFA_ACTIVE_STORAGE_KEY, String(active));
}

export function clearStoredMfaActive(): void {
  localStorage.removeItem(MFA_ACTIVE_STORAGE_KEY);
}

// Shared axios instance used by every API call in the app.
export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// Attach the access token to every request except the refresh call itself.
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token && !config.url?.includes(AUTH_API.REFRESH_TOKEN)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// True on login/register pages; avoids refreshing while anonymous.
function isAuthPage(): boolean {
  return /(login|register)(\/|$)/.test(window.location.pathname);
}

// axios' config type has no slot for our retry marker, so extend it locally.
export type RetryableConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
};

// Business-level 401s (mfa/verify challenge, mfa/disable password) skip refresh.
export type SkipRefreshConfig = AxiosRequestConfig & { _skipRefresh: true };

// ---- Single-flight token refresh (concurrent 401s share one refresh) ----

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) return null;

  const response = await apiClient.post(AUTH_API.REFRESH_TOKEN, {
    refresh_token: refreshToken,
  });

  // Responses may be enveloped/snake_case; normalize before reading.
  const payload: Payload = unwrapPayload(response.data);
  const accessToken = pickString(payload, [
    "accessToken",
    "access_token",
    "token",
    "jwt",
  ]);

  if (!accessToken) return null;

  setAccessToken(accessToken);

  // Store the rotated refresh token when returned, else keep the existing one.
  const rotatedRefreshToken = pickString(payload, [
    "refreshToken",
    "refresh_token",
  ]);

  if (rotatedRefreshToken) {
    setRefreshToken(rotatedRefreshToken);
  }

  return accessToken;
}

function queueRefresh(): Promise<string | null> {
  // Refresh in flight: wait for its result instead of firing a second one.
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshQueue.push(resolve);
    });
  }

  isRefreshing = true;

  return refreshAccessToken()
    .finally(() => {
      isRefreshing = false;
    })
    .then((token) => {
      // Resolve every queued 401 handler with the same new token.
      refreshQueue.forEach((resolve) => resolve(token));
      refreshQueue = [];
      return token;
    })
    .catch((error) => {
      // Refresh failed: unblock queued 401s with null so they fail fast.
      refreshQueue.forEach((resolve) => resolve(null));
      refreshQueue = [];
      throw error;
    });
}

// ---- Response handling -------------------------------------------------

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status as number | undefined;
    const url = error?.config?.url as string | undefined;
    const config = error?.config as InternalAxiosRequestConfig | undefined;

    // Only 401 responses trigger the refresh flow.
    if (status !== 401 || !config) {
      return Promise.reject(error);
    }

    // Allowed 401s: bad credentials, auth pages, refresh call, _skipRefresh.
    const isAuthRequest =
      url?.includes("/auth/login") || url?.includes("/auth/register");
    const isSkipRefreshRequest =
      (config as RetryableConfig & { _skipRefresh?: boolean })._skipRefresh ===
      true;

    if (
      isAuthRequest ||
      isAuthPage() ||
      url?.includes("/auth/refresh") ||
      isSkipRefreshRequest
    ) {
      return Promise.reject(error);
    }

    // Already retried once: a second 401 can't be salvaged, so bail out.
    if ((config as RetryableConfig)._retried) {
      clearAuthTokens();
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
      return Promise.reject(error);
    }

    try {
      const newToken = await queueRefresh();

      // Refresh failed: the session is over, clear it and notify the app.
      if (!newToken) {
        clearAuthTokens();
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
        return Promise.reject(error);
      }

      // Retry the original request with the fresh token — exactly once.
      (config as RetryableConfig)._retried = true;
      config.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(config);
    } catch (refreshError) {
      clearAuthTokens();
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
      return Promise.reject(refreshError);
    }
  },
);

// Retry-After seconds from a 429 response; 0 when absent or unparseable.
export function getRetryAfterSeconds(error: unknown): number {
  if (axios.isAxiosError(error)) {
    const header = error.response?.headers?.["retry-after"];

    if (typeof header === "string") {
      const seconds = Number.parseInt(header, 10);
      if (Number.isFinite(seconds) && seconds > 0) return seconds;
    } else if (typeof header === "number" && header > 0) {
      return Math.ceil(header);
    }
  }

  return 0;
}

// Login-verify carries no access token; mint one via the refresh path (§11.5).
export async function finalizeLoginWithMfa(
  result: MfaLoginVerifyResponse,
): Promise<void> {
  if (result.accessToken) {
    setAccessToken(result.accessToken);
  }

  if (result.refreshToken) {
    setRefreshToken(result.refreshToken);
  }

  if (!result.accessToken && !result.refreshToken) {
    throw new Error("MFA login: verify response carried no tokens");
  }

  if (!result.accessToken) {
    // Mint an access token from the refresh token we just stored.
    try {
      const accessToken = await refreshAccessToken();

      if (!accessToken) {
        throw new Error("MFA login: refresh failed to mint an access token");
      }
    } catch (error) {
      // Don't leave a half-stored session behind when the handshake fails.
      clearAuthTokens();
      throw error;
    }
  }
}
