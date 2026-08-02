import { pickString, unwrapPayload, type Payload } from "@/lib/payload";
import { normalizeUser, type User } from "./user";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  mfaToken?: string;
  mfaRequired: boolean;
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

  const mfaToken = pickString(payload, ["mfaToken", "mfa_token"]);
  const mfaRequired = Boolean(mfaToken) || Boolean(payload.mfa_required);

  const rawUser = payload.user;

  // The backend may return the user as a nested `user` object or — as in the
  // documented login response — as flat fields (`email`, `mfa`, …) next to
  // the tokens. Synthesize the user from the payload itself when it carries
  // user-ish fields, so callers can read the MFA state from either shape.
  const user =
    typeof rawUser === "object" && rawUser !== null
      ? normalizeUser(rawUser)
      : payload.email !== undefined || payload.mfa !== undefined
        ? normalizeUser(payload)
        : null;

  return {
    accessToken,
    refreshToken: pickString(payload, ["refreshToken", "refresh_token"]),
    mfaToken,
    mfaRequired,
    user,
  };
}
