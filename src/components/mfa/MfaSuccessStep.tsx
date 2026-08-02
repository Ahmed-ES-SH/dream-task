import { CircleCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/useLocale";
import { useTranslations } from "@/hooks/useTranslations";
import { formatDate } from "@/lib/format";

type MfaSuccessStepProps = {
  verifiedAt?: string;
  onDone: () => void;
};

// Static confirmation of the enable flow: check icon, timestamp, Done action.
export default function MfaSuccessStep({
  verifiedAt,
  onDone,
}: MfaSuccessStepProps) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="space-y-4 py-4 text-center">
      <CircleCheck className="mx-auto size-12 text-green-600" />
      <h2 className="text-lg font-semibold">{t("mfa.successTitle")}</h2>
      <p className="text-sm text-muted-foreground">
        {t("mfa.successDescription")}
      </p>

      {verifiedAt && (
        <p className="text-xs text-muted-foreground">
          {formatDate(locale, verifiedAt)}
        </p>
      )}

      <Button type="button" onClick={onDone} className="h-11 w-full">
        {t("mfa.successDone")}
      </Button>
    </div>
  );
}
