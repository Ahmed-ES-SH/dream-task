import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/useTranslations";

type MfaDisableButtonProps = {
  disabled?: boolean;
  onClick: () => void;
};

// "Disable MFA" action (spec §8.1): destructive variant, opens
// `MfaDisableModal` in Phase 11 — the click bubbles up so `MfaSecurityCard`
// can flip its `disableOpen` flag.
export default function MfaDisableButton({
  disabled,
  onClick,
}: MfaDisableButtonProps) {
  const t = useTranslations();

  return (
    <Button variant="destructive" onClick={onClick} disabled={disabled}>
      {t("mfa.disableMfa")}
    </Button>
  );
}
