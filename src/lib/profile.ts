import type { StringKey, Translator } from "@/types/profile";
import type { User } from "@/types/user";

export function labelFor(
  t: Translator,
  value: string,
  keys: Record<string, StringKey>,
): string {
  const key = keys[value.toLowerCase()];

  if (!key) {
    return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "—";
  }

  return t(key);
}

// MFA state reported by the backend: some responses carry `mfa.enabled`,
// others (e.g. /me, login-verify) carry `mfa.verified`. Either signal is
// authoritative when present. Returns `null` (= unknown) when the user
// exposes no MFA fields at all.
export function getMfaStatus(user: User | undefined | null): boolean | null {
  const mfa = user?.mfa;

  if (mfa?.enabled !== undefined) return mfa.enabled;
  if (mfa?.verified !== undefined) return mfa.verified;

  return null;
}
