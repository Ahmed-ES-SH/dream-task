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

import { apiClient, type SkipRefreshConfig } from "./http";

// ---- Public API wrappers (normalize responses into app types) ----

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
    // 401 here means the challenge expired, so skip the refresh flow.
    const config: SkipRefreshConfig = { _skipRefresh: true };
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
  // 401 here means the password is wrong, so skip the refresh flow.
  const config: SkipRefreshConfig = { _skipRefresh: true };
  await apiClient.post(AUTH_API.MFA_DISABLE, body, config);
}
