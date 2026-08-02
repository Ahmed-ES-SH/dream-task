import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "@/hooks/useTranslations";

type MfaEnablePromptDialogProps = {
  open: boolean;
  // Any dismissal (Not now, X, Esc, outside click) refuses MFA: end the session.
  onRefuse: () => void;
  // Open the enable wizard (MfaSetupModal) instead.
  onEnable: () => void;
};

// Post-login gate: every dismissal counts as a refusal — no "stay here" option.
export default function MfaEnablePromptDialog({
  open,
  onRefuse,
  onEnable,
}: MfaEnablePromptDialogProps) {
  const t = useTranslations();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Any user-initiated close (X, Esc, outside click) is a refusal.
        if (!next) onRefuse();
      }}
    >
      <DialogPopup className="w-full sm:max-w-md">
        <DialogTitle>{t("mfa.enablePromptTitle")}</DialogTitle>
        <DialogDescription>
          {t("mfa.enablePromptDescription")}
        </DialogDescription>
        <DialogCloseButton />

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onRefuse}>
            {t("mfa.enableLater")}
          </Button>
          <Button onClick={onEnable}>{t("mfa.enableMfa")}</Button>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
