import { LogOutIcon, SettingsIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LocaleLink from "@/components/website/LocaleLink";
import { useProfile } from "@/hooks/useProfile";
import { useTranslations } from "@/hooks/useTranslations";
import { getInitials } from "@/lib/format";
import { useAuth } from "@/store/auth";

type UserMenuProps = {
  variant?: "compact" | "full";
};

export default function UserMenu({ variant = "full" }: UserMenuProps) {
  const t = useTranslations();
  const { data: user, isLoading } = useProfile();
  const { logout } = useAuth();
  const { locale } = useParams<{ locale?: string }>();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(`/${locale ?? "en"}/login`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
        {variant === "full" && (
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-36 animate-pulse rounded bg-muted" />
          </div>
        )}
      </div>
    );
  }

  const displayName = user?.fullName ?? "—";
  const displayEmail = user?.email ?? "—";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className={
              variant === "full"
                ? "h-auto w-full justify-start gap-3 px-2 py-2"
                : "size-9 rounded-full"
            }
            aria-label={t("profile.menu")}
          >
            <Avatar className={variant === "full" ? "size-9" : "size-8"}>
              {user?.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={displayName} />
              )}
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>

            {variant === "full" && (
              <span className="min-w-0 flex-1 text-start">
                <span className="block truncate text-sm font-medium">
                  {displayName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {displayEmail}
                </span>
              </span>
            )}
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<LocaleLink to="/dashboard/settings" />}>
          <SettingsIcon />
          {t("settings.title")}
        </DropdownMenuItem>

        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOutIcon />
          {t("common.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
