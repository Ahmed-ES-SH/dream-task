import axios, { type AxiosInstance } from "axios";

import { AUTH_API } from "@/constants/auth.api";
import { PROFILE_API } from "@/constants/profile.api";
import {
  normalizeLoginResponse,
  type LoginRequest,
  type LoginResponse,
} from "@/types/auth";
import { normalizeUser, type User } from "@/types/user";

import { pickString, type Payload } from "./payload";

export const TOKEN_STORAGE_KEY = "access_token";
export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined;

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status as number | undefined;
    const url = error?.config?.url as string | undefined;

    if (status === 401 && !url?.includes("/auth/login")) {
      clearAccessToken();
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }

    return Promise.reject(error);
  },
);

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
