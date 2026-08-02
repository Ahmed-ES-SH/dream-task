import {
  AlertCircle,
  CalendarDays,
  Clock3,
  RefreshCw,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLocale } from "@/hooks/useLocale";
import { useProfile } from "@/hooks/useProfile";
import {
  useTranslations,
  type Messages,
  type NestedKeys,
} from "@/hooks/useTranslations";
import { formatDate, getInitials } from "@/lib/format";
import type { User } from "@/types/user";

const ROLE_LABEL_KEYS: Record<string, NestedKeys<Messages>> = {
  admin: "profile.roles.admin",
  manager: "profile.roles.manager",
  user: "profile.roles.user",
  member: "profile.roles.member",
  support: "profile.roles.support",
};

const STATUS_LABEL_KEYS: Record<string, NestedKeys<Messages>> = {
  active: "profile.statuses.active",
  pending: "profile.statuses.pending",
  suspended: "profile.statuses.suspended",
  banned: "profile.statuses.banned",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  active:
    "border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  pending:
    "border-transparent bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  suspended: "",
  banned: "",
};

type Translator = ReturnType<typeof useTranslations>;

function labelForKey(
  t: Translator,
  keys: Record<string, NestedKeys<Messages>>,
  value: string,
  fallback: string,
): string {
  const key = value && keys[value.toLowerCase()];
  if (key) return t(key) as string;
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : fallback;
}

function StatusBadge({ user }: { user: User }) {
  const t = useTranslations();

  const isBlocked =
    user.status.toLowerCase() === "suspended" ||
    user.status.toLowerCase() === "banned";

  return (
    <Badge
      variant={isBlocked ? "destructive" : "outline"}
      className={
        isBlocked
          ? undefined
          : STATUS_BADGE_CLASSES[user.status.toLowerCase()] ?? "border-transparent"
      }
    >
      {labelForKey(t, STATUS_LABEL_KEYS, user.status, "—")}
    </Badge>
  );
}

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0">
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}

function ProfileCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <div className="size-16 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-3 w-56 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function UserProfileCard() {
  const t = useTranslations();
  const locale = useLocale() ?? "en";
  const { data: user, isLoading, isError, refetch } = useProfile();

  if (isLoading) return <ProfileCardSkeleton />;

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>{t("profile.errorTitle")}</AlertTitle>
        <AlertDescription>{t("profile.error")}</AlertDescription>
        <AlertAction>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5"
          >
            <RefreshCw />
            {t("common.retry")}
          </Button>
        </AlertAction>
      </Alert>
    );
  }

  if (!user || (!user.id && !user.email)) {
    return (
      <Alert>
        <UserRound />
        <AlertTitle>{t("profile.emptyTitle")}</AlertTitle>
        <AlertDescription>{t("profile.empty")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-4 space-y-0">
        <Avatar className="size-16">
          {user.avatarUrl && (
            <AvatarImage src={user.avatarUrl} alt={user.fullName} />
          )}
          <AvatarFallback className="text-lg">
            {getInitials(user.fullName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <CardTitle className="truncate text-xl font-bold">
            {user.fullName}
          </CardTitle>
          <CardDescription className="truncate">{user.email}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Separator />

        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <InfoItem
            label={t("profile.role")}
            value={
              <Badge variant="outline" className="border-transparent">
                {labelForKey(t, ROLE_LABEL_KEYS, user.role, "—")}
              </Badge>
            }
          />
          <InfoItem label={t("profile.status")} value={<StatusBadge user={user} />} />
          <InfoItem
            label={t("profile.memberSince")}
            value={formatDate(locale, user.createdAt)}
            icon={CalendarDays}
          />
          <InfoItem
            label={t("profile.lastLogin")}
            value={formatDate(locale, user.lastLoginAt)}
            icon={Clock3}
          />
        </dl>
      </CardContent>
    </Card>
  );
}
