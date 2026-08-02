import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

import { AUTH_API } from "@/constants/auth.api";
import { PROFILE_API } from "@/constants/profile.api";
import {
  normalizeLoginResponse,
  type LoginRequest,
  type LoginResponse,
} from "@/types/auth";
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
const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined;

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
    // bad credentials, anonymous pages, and the refresh call itself.
    const isAuthRequest =
      url?.includes("/auth/login") || url?.includes("/auth/register");

    if (isAuthRequest || isAuthPage() || url?.includes("/auth/refresh")) {
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

      // Retry the original request with the fresh token.
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
