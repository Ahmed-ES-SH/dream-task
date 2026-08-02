import {
  AlertCircle,
  CalendarDays,
  Clock3,
  Globe2,
  Languages,
  Phone,
  RefreshCw,
  UserRound,
} from "lucide-react";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProfileCardSkeleton } from "@/components/dashboard/ProfileCardSkeleton";
import { ProfileInfoItem } from "@/components/dashboard/ProfileInfoItem";
import { ProfileStatusBadge } from "@/components/dashboard/ProfileStatusBadge";
import { ROLE_LABEL_KEYS } from "@/constants/profile";
import { useLocale } from "@/hooks/useLocale";
import { useProfile } from "@/hooks/useProfile";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";
import { formatDate, getInitials } from "@/lib/format";
import { labelFor } from "@/lib/profile";

type UserProfileCardProps = {
  onAvatarClick?: () => void;
};

export default function UserProfileCard({
  onAvatarClick,
}: UserProfileCardProps = {}) {
  const t = useTranslations();
  const locale = useLocale() ?? "en";
  const { data: user, isLoading, isError, refetch } = useProfile();

  if (isLoading) {
    return <ProfileCardSkeleton />;
  }

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

  if (!user?.id && !user?.email) {
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
          {user.avatarUrl || !onAvatarClick ? (
            <AvatarFallback className="text-lg">
              {getInitials(user.fullName)}
            </AvatarFallback>
          ) : (
            <button
              type="button"
              onClick={onAvatarClick}
              aria-label={t("profile.editAvatar")}
              className={cn(
                "inline-flex size-full items-center justify-center rounded-full bg-muted text-lg font-medium text-muted-foreground transition-colors",
                "hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              {getInitials(user.fullName)}
            </button>
          )}
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
          <ProfileInfoItem
            label={t("profile.role")}
            value={
              <Badge variant="outline" className="border-transparent">
                {labelFor(t, user.role, ROLE_LABEL_KEYS)}
              </Badge>
            }
          />
          <ProfileInfoItem
            label={t("profile.status")}
            value={<ProfileStatusBadge user={user} />}
          />
          <ProfileInfoItem
            label={t("profile.memberSince")}
            value={formatDate(locale, user.createdAt)}
            icon={CalendarDays}
          />
          <ProfileInfoItem
            label={t("profile.lastLogin")}
            value={formatDate(locale, user.lastLoginAt)}
            icon={Clock3}
          />
          <ProfileInfoItem
            label={t("profile.mobile")}
            value={user.mobile || "—"}
            icon={Phone}
          />
          <ProfileInfoItem
            label={t("profile.timezone")}
            value={user.timezone || "—"}
            icon={Globe2}
          />
          <ProfileInfoItem
            label={t("profile.locale")}
            value={user.locale || "—"}
            icon={Languages}
          />
        </dl>
      </CardContent>
    </Card>
  );
}
