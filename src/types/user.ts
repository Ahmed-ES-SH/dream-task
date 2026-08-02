import { pickString, unwrapPayload, type Payload } from "@/lib/payload";

export type User = {
  id: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: string;
  status: string;
  avatarUrl?: string;
  locale?: string;
  timezone?: string;
  mobile?: string | null;
  theme?: string;
  createdAt: string;
  lastLoginAt: string | null;
  mfa?: {
    enabled?: boolean;
    verified?: boolean;
    verifiedAt?: string;
    methods?: string[];
  };
};

export function normalizeUser(raw: unknown): User {
  const obj: Payload = unwrapPayload(raw);

  const lastLoginAt =
    pickString(obj, [
      "lastLoginAt",
      "last_login_at",
      "lastLogin",
      "last_login",
      "lastActivity",
      "last_activity",
    ]) ?? null;

  const isActive = (obj as Payload).is_active ?? (obj as Payload).isActive;

  const rawMfa = obj.mfa;
  const mfa =
    typeof rawMfa === "object" && rawMfa !== null
      ? {
          enabled: typeof (rawMfa as Payload).enabled === "boolean"
            ? (rawMfa as Payload).enabled === true
            : undefined,
          verified: typeof (rawMfa as Payload).verified === "boolean"
            ? (rawMfa as Payload).verified === true
            : undefined,
          verifiedAt: pickString(rawMfa as Payload, ["verifiedAt", "verified_at"]),
          methods: Array.isArray((rawMfa as Payload).methods)
            ? ((rawMfa as Payload).methods as unknown[]).filter(
                (item): item is string => typeof item === "string",
              )
            : undefined,
        }
      : undefined;

  return {
    id: pickString(obj, ["id", "_id", "userId", "user_id"]) ?? "",
    fullName:
      pickString(obj, ["fullName", "full_name", "name", "displayName", "display_name"]) ??
      pickString(obj, ["email", "emailAddress", "email_address"]) ??
      "Unknown user",
    firstName: pickString(obj, ["firstName", "first_name"]) ?? null,
    lastName: pickString(obj, ["lastName", "last_name"]) ?? null,
    email: pickString(obj, ["email", "emailAddress", "email_address"]) ?? "",
    role: pickString(obj, ["role", "userRole", "user_role"]) ?? "",
    status:
      pickString(obj, ["status", "accountStatus", "account_status"]) ??
      (typeof isActive === "boolean" ? (isActive ? "active" : "inactive") : ""),
    avatarUrl: pickString(obj, [
      "avatarUrl",
      "avatar_url",
      "profileImage",
      "profile_image",
      "image",
    ]),
    locale: pickString(obj, ["locale", "language"]),
    timezone: pickString(obj, ["timezone", "time_zone", "tz"]),
    mobile: pickString(obj, ["mobile", "phone", "phoneNumber", "phone_number"]) ?? null,
    theme: pickString(obj, ["theme", "preferredTheme", "preferred_theme"]),
    createdAt:
      pickString(obj, ["createdAt", "created_at", "dateCreated", "registeredAt"]) ??
      "",
    lastLoginAt,
    mfa,
  };
}
