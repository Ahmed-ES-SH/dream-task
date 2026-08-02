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
  // The user refused to enable MFA (Not now, X, Esc, outside click): the
  // settings page ends the session and returns the user to the login page.
  onRefuse: () => void;
  // Open the enable wizard (MfaSetupModal) instead.
  onEnable: () => void;
};

// Post-login gate prompt (UX: "enable your MFA to access the panel"). Shown
// on the settings page whenever the session's MFA is inactive. Every
// dismissal path counts as a refusal — there is no "stay here" option
// because the dashboard is unreachable without MFA anyway.
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
