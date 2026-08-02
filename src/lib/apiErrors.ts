import axios from "axios";

import { pickString, type Payload } from "@/lib/payload";
import type { StringKey, Translator } from "@/types/profile";

// ---- Single source of truth: backend errors → user-facing messages --------
// Every backend error code/status the app can encounter is mapped here to a
// translation key. Server-provided messages are intentionally never rendered:
// the mapping below is the only error text a user ever sees, so wording stays
// consistent, localized, and free of backend internals.

// Backend error code → translation key (matched first; e.g. `MFA_CODE_INVALID`).
const CODE_MESSAGE_KEYS: Record<string, StringKey> = {
  UNAUTHENTICATED: "errors.unauthorized",
  MFA_CODE_INVALID: "errors.mfaCodeInvalid",
  ACCOUNT_INACTIVE: "errors.accountInactive",
  LICENSE_DENIED: "errors.licenseDenied",
  THROTTLED: "errors.throttled",
  LICENSE_CHECK_FAILED: "errors.licenseCheckFailed",
  MFA_ALREADY_ENABLED: "mfa.alreadyEnabled",
  MFA_NOT_ENABLED: "mfa.alreadyDisabled",
  ACCESS_DENIED: "errors.accessDenied",
};

// HTTP status → translation key (fallback when the response carries no code).
const STATUS_MESSAGE_KEYS: Record<number, StringKey> = {
  401: "errors.unauthorized",
  403: "errors.accessDenied",
  429: "errors.throttled",
  503: "errors.licenseCheckFailed",
};

// Best-effort extraction of the HTTP status code (401/422/429/...) from any
// error, used by components to branch on specific server responses.
export function getApiErrorStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }

  return undefined;
}

// Best-effort extraction of the backend error code (e.g. MFA_ALREADY_ENABLED,
// MFA_CODE_INVALID) from any error. Returns undefined when no code is present.
export function getApiErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Payload | undefined;
    const code = data && pickString(data, ["code", "errorCode", "error_code"]);
    if (code) return code;
  }

  return undefined;
}

// Resolve the translation key for an API error: the backend code wins when
// present, the HTTP status is the fallback. Returns undefined when the error
// is not an API error (or carries neither signal) — callers then fall back to
// their own context-specific key.
export function getApiErrorTranslationKey(
  error: unknown,
): StringKey | undefined {
  if (!axios.isAxiosError(error)) return undefined;

  const code = getApiErrorCode(error);
  if (code) {
    const byCode = CODE_MESSAGE_KEYS[code.toUpperCase()];
    if (byCode) return byCode;
  }

  const status = getApiErrorStatus(error);
  if (status) return STATUS_MESSAGE_KEYS[status];

  return undefined;
}

// The translation key for an API error, with the caller's context-specific
// fallback key when the error carries no mapped signal. Returns a key — not
// translated text — so components can translate at render time and the
// message stays in sync when the user switches language.
export function getApiErrorKey(
  error: unknown,
  fallbackKey: StringKey,
): StringKey {
  return getApiErrorTranslationKey(error) ?? fallbackKey;
}

// The user-facing message for an API error, translated from the mapped key —
// server-provided messages are never shown. `fallbackKey` is the caller's
// context-specific key used when the error carries no mapped signal.
export function getApiErrorMessage(
  error: unknown,
  t: Translator,
  fallbackKey: StringKey,
): string {
  return t(getApiErrorKey(error, fallbackKey));
}
