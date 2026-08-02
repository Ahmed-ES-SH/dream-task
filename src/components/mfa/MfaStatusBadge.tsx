import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/hooks/useTranslations";

export type MfaStatus = "enabled" | "disabled" | "unknown";

type MfaStatusBadgeProps = {
  status: MfaStatus;
};

const badgeVariantByStatus: Record<
  MfaStatus,
  "default" | "secondary"
> = {
  enabled: "default",
  disabled: "secondary",
  unknown: "secondary",
};

// Status pill for the Security card (spec §8.1): green "Enabled" for
// `enabled`, gray "Disabled" for `disabled`, gray "Unknown" for `unknown`.
// The card only mounts this badge when the profile exposes MFA fields, so the
// `unknown` variant is a defensive fallback, never a fabricated status (§6.2).
export default function MfaStatusBadge({ status }: MfaStatusBadgeProps) {
  const t = useTranslations();

  const label =
    status === "enabled"
      ? t("mfa.statusEnabled")
      : status === "disabled"
        ? t("mfa.statusDisabled")
        : t("mfa.statusUnknown");

  return <Badge variant={badgeVariantByStatus[status]}>{label}</Badge>;
}
