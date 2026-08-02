import { pickString, unwrapPayload, type Payload } from "@/lib/payload";

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string | null;
};

export function normalizeUser(raw: unknown): User {
  const obj: Payload = unwrapPayload(raw);

  const lastLoginAt =
    pickString(obj, ["lastLoginAt", "last_login_at", "lastLogin", "last_login"]) ??
    null;

  return {
    id: pickString(obj, ["id", "_id", "userId", "user_id"]) ?? "",
    fullName:
      pickString(obj, ["fullName", "full_name", "name", "displayName", "display_name"]) ??
      pickString(obj, ["email", "emailAddress", "email_address"]) ??
      "Unknown user",
    email: pickString(obj, ["email", "emailAddress", "email_address"]) ?? "",
    role: pickString(obj, ["role", "userRole", "user_role"]) ?? "",
    status:
      pickString(obj, ["status", "accountStatus", "account_status"]) ?? "",
    avatarUrl: pickString(obj, [
      "avatarUrl",
      "avatar_url",
      "profileImage",
      "profile_image",
      "image",
    ]),
    createdAt:
      pickString(obj, ["createdAt", "created_at", "dateCreated", "registeredAt"]) ??
      "",
    lastLoginAt,
  };
}
