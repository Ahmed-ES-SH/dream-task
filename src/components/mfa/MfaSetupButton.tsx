import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/useTranslations";

type MfaSetupButtonProps = {
  disabled?: boolean;
  onClick: () => void;
};

// "Enable MFA" action (spec §8.1): opens `MfaSetupModal` in Phase 9 — the
// click bubbles up so `MfaSecurityCard` can flip its `setupOpen` flag.
export default function MfaSetupButton({
  disabled,
  onClick,
}: MfaSetupButtonProps) {
  const t = useTranslations();

  return (
    <Button onClick={onClick} disabled={disabled}>
      {t("mfa.enableMfa")}
    </Button>
  );
}
