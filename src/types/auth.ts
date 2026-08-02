import { pickString, unwrapPayload, type Payload } from "@/lib/payload";
import { normalizeUser, type User } from "./user";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  user?: User | null;
};

export function normalizeLoginResponse(raw: unknown): LoginResponse {
  const payload: Payload = unwrapPayload(raw);

  const accessToken = pickString(payload, [
    "accessToken",
    "access_token",
    "token",
    "jwt",
  ]);

  if (!accessToken) {
    throw new Error("No access token found in login response");
  }

  const rawUser = payload.user;

  return {
    accessToken,
    refreshToken: pickString(payload, ["refreshToken", "refresh_token"]),
    user: typeof rawUser === "object" && rawUser !== null
      ? normalizeUser(rawUser)
      : null,
  };
}
