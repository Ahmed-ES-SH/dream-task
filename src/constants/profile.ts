import type { StringKey } from "@/types/profile";

export const ROLE_LABEL_KEYS: Record<string, StringKey> = {
  admin: "profile.roles.admin",
  manager: "profile.roles.manager",
  user: "profile.roles.user",
  member: "profile.roles.member",
  support: "profile.roles.support",
};

export const STATUS_LABEL_KEYS: Record<string, StringKey> = {
  active: "profile.statuses.active",
  pending: "profile.statuses.pending",
  suspended: "profile.statuses.suspended",
  banned: "profile.statuses.banned",
};

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  active:
    "border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  pending:
    "border-transparent bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
};

export const BLOCKED_STATUSES = new Set(["suspended", "banned"]);
