import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { AUTH_API } from "@/constants/auth.api";
import { PROFILE_API } from "@/constants/profile.api";
import {
  normalizeLoginResponse,
  type LoginRequest,
  type LoginResponse,
} from "@/types/auth";
import {
  normalizeLoginVerify,
  normalizeMfaSetup,
  normalizeSetupVerify,
  type MfaLoginVerifyResponse,
  type MfaSetup,
  type MfaSetupVerifyResponse,
  type MfaVerifyBody,
} from "@/types/mfa";
import { normalizeUser, type User } from "@/types/user";

import { pickString, unwrapPayload, type Payload } from "./payload";

// Session tokens are persisted in localStorage so they survive page reloads and
// can be read synchronously by the axios interceptors (no async storage lookup).
export const TOKEN_STORAGE_KEY = "access_token";
export const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";

// Custom event dispatched when the session is no longer valid (refresh failed).
// AuthProvider (src/store/auth.tsx) listens to it to sign the user out.
export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

// Base URL of the backend API, read from VITE_API_BASE_URL (see .env.example).
// const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined;
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

// Shared axios instance used by every API call in the app.
const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// Attach the access token to every outgoing request — except the refresh call
// itself, which must never carry a possibly-stale access token.
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token && !config.url?.includes(AUTH_API.REFRESH_TOKEN)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// True when the current page is the login/register page; used to avoid
// triggering a token refresh while the user is (or may be) anonymous.
function isAuthPage(): boolean {
  return /(login|register)(\/|$)/.test(window.location.pathname);
}

// axios' config type has no slot for our retry marker, so extend it locally.
type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

// Custom flag set on login-context mfa/verify calls; a 401 there means the
// challenge expired, not that the session is invalid, so the interceptor must
// skip the refresh flow for them.
type VerifyConfig = AxiosRequestConfig & { _skipRefresh: true };

// ---- Single-flight token refresh --------------------------------------
// Only one refresh request runs at a time; concurrent 401s are queued and all
// resolved with the single new token once it arrives.

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) return null;

  const response = await apiClient.post(AUTH_API.REFRESH_TOKEN, {
    refresh_token: refreshToken,
  });

  // Backends may wrap responses in an envelope ({ data: ... }) and/or use
  // camelCase/snake_case keys, so the payload is normalized before reading.
  const payload: Payload = unwrapPayload(response.data);
  const accessToken = pickString(payload, [
    "accessToken",
    "access_token",
    "token",
    "jwt",
  ]);

  if (!accessToken) return null;

  setAccessToken(accessToken);

  // Refresh tokens are usually rotated: store the new one when returned,
  // otherwise keep the existing refresh token.
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
  // A refresh is already in flight: wait for its result instead of firing a
  // second (likely failing) refresh request.
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
      // The refresh call itself failed: unblock every queued 401 handler with
      // `null` so their requests fail fast instead of hanging forever.
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

    // Never refresh for the endpoints/pages that are allowed to 401:
    // bad credentials, anonymous pages, the refresh call itself, and
    // login-context mfa/verify (where a 401 means the challenge expired,
    // not that the session is invalid).
    const isAuthRequest =
      url?.includes("/auth/login") || url?.includes("/auth/register");
    const isLoginMfaVerify =
      url?.includes("/auth/mfa/verify") &&
      (config as RetryableConfig & { _skipRefresh?: boolean })._skipRefresh ===
        true;

    if (
      isAuthRequest ||
      isAuthPage() ||
      url?.includes("/auth/refresh") ||
      isLoginMfaVerify
    ) {
      return Promise.reject(error);
    }

    // The original request was already retried once with a fresh token. A
    // second 401 means refreshing again can't salvage the session (e.g. a
    // disabled account), so bail out instead of looping forever.
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

// Best-effort extraction of a human-readable message from any error, used to
// surface API errors in forms (falls back to the provided string).
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Payload | undefined;
    const message = data && pickString(data, ["message", "error", "detail"]);
    if (message) return message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

// Best-effort extraction of the backend error code (e.g. MFA_ALREADY_ENABLED,
// MFA_NOT_ENABLED, MFA_RATE_LIMITED) from any error, used by components to
// branch on specific server errors. Returns undefined when no code is present.
export function getApiErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Payload | undefined;
    const code = data && pickString(data, ["code", "errorCode", "error_code"]);
    if (code) return code;
  }

  return undefined;
}

// Best-effort extraction of the HTTP status code (401/422/429/...) from any
// error, used by components to branch on specific server responses.
export function getApiErrorStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }

  return undefined;
}

// Seconds from a 429 response's `Retry-After` header, or 0 when absent or
// unparseable (spec §12.3). Used to disable the submit button during the
// rate-limit window.
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

// ---- Public API wrappers ----------------------------------------------
// Each wrapper calls one endpoint and normalizes the raw response into the
// app's own types (see src/types/*).

export async function loginRequest(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  const response = await apiClient.post(AUTH_API.LOGIN, credentials);
  return normalizeLoginResponse(response.data);
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post(AUTH_API.LOGOUT);
}

export async function profileRequest(): Promise<User> {
  const response = await apiClient.get(PROFILE_API.GET_PROFILE);
  return normalizeUser(response.data);
}

// ---- Login-verify token handshake (spec §11.5) -------------------------
// The documented login-verify response carries a refresh token but no access
// token; when the access token is absent we mint one via the existing refresh
// path. If the backend ever returns an access token at login-verify, this
// branch never triggers (open question Q2).
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

export async function mfaSetupRequest(email: string): Promise<MfaSetup> {
  const response = await apiClient.post(AUTH_API.MFA_SETUP, {
    issuer: "MAYA",
    label: email,
  });
  return normalizeMfaSetup(response.data);
}

export async function mfaVerifyRequest(
  body: MfaVerifyBody,
): Promise<MfaSetupVerifyResponse | MfaLoginVerifyResponse> {
  if (body.context === "login") {
    // A 401 here means the challenge expired, not that the session is
    // invalid, so the refresh flow must be skipped (see the interceptor).
    const config: VerifyConfig = { _skipRefresh: true };
    const response = await apiClient.post(AUTH_API.MFA_VERIFY, body, config);
    return normalizeLoginVerify(response.data);
  }

  const response = await apiClient.post(AUTH_API.MFA_VERIFY, body);
  return normalizeSetupVerify(response.data);
}

export async function mfaDisableRequest(body: {
  password: string;
  code: string;
}): Promise<void> {
  await apiClient.post(AUTH_API.MFA_DISABLE, body);
}
