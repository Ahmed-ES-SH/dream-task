import { Badge } from "@/components/ui/badge";
import {
  BLOCKED_STATUSES,
  STATUS_BADGE_CLASSES,
  STATUS_LABEL_KEYS,
} from "@/constants/profile";
import { useTranslations } from "@/hooks/useTranslations";
import { labelFor } from "@/lib/profile";
import type { StatusBadgeProps } from "@/types/profile";

export function ProfileStatusBadge({ user }: StatusBadgeProps) {
  const t = useTranslations();

  const status = user.status.toLowerCase();
  const isBlocked = BLOCKED_STATUSES.has(status);

  return (
    <Badge
      variant={isBlocked ? "destructive" : "outline"}
      className={
        isBlocked
          ? undefined
          : STATUS_BADGE_CLASSES[status] ?? "border-transparent"
      }
    >
      {labelFor(t, user.status, STATUS_LABEL_KEYS)}
    </Badge>
  );
}
