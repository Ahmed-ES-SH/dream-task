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

// Status pill for the Security card; the `unknown` variant is a defensive fallback.
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
