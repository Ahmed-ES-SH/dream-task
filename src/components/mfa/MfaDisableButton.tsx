import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/useTranslations";

type MfaDisableButtonProps = {
  disabled?: boolean;
  onClick: () => void;
};

// "Disable MFA" action: the click bubbles up so MfaSecurityCard flips its disable flag.
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
