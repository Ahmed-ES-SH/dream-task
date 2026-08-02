import { CircleAlert, Loader2 } from "lucide-react";

import MfaQrStep from "@/components/mfa/MfaQrStep";
import MfaSuccessStep from "@/components/mfa/MfaSuccessStep";
import MfaVerifyStep from "@/components/mfa/MfaVerifyStep";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogCloseButton,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMfaSetupModal } from "@/hooks/useMfaSetupModal";
import { useTranslations } from "@/hooks/useTranslations";

type MfaSetupModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Optional email from the caller: fires the setup request without waiting for /me.
  email?: string;
  // 409 MFA_ALREADY_ENABLED — setup finished in another tab.
  onAlreadyEnabled?: () => void;
  // Verify succeeded and the user finished the wizard.
  onEnabled?: (verifiedAt?: string) => void;
};

// Enable-wizard shell: loading → qr → verify → success; closing early cancels silently.
export default function MfaSetupModal({
  open,
  onOpenChange,
  email,
  onAlreadyEnabled,
  onEnabled,
}: MfaSetupModalProps) {
  const t = useTranslations();
  const {
    step,
    setupData,
    setupError,
    verifiedAt,
    handleOpenChange,
    retrySetup,
    handleVerifySuccess,
    goToQr,
    goToVerify,
  } = useMfaSetupModal({ open, onOpenChange, email, onAlreadyEnabled, onEnabled });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="w-full sm:max-w-md">
        <DialogTitle>{t("mfa.setupTitle")}</DialogTitle>
        <DialogCloseButton />

        {step === "loading" && (
          <div
            role="status"
            className="flex flex-col items-center justify-center gap-3 py-8"
          >
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("mfa.setupLoading")}
            </p>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{setupError}</AlertDescription>
            </Alert>
            <Button type="button" onClick={retrySetup} className="h-11 w-full">
              {t("mfa.setupRetry")}
            </Button>
          </div>
        )}

        {step === "qr" && setupData && (
          <MfaQrStep setup={setupData} onContinue={goToVerify} />
        )}

        {step === "verify" && (
          <MfaVerifyStep
            context="setup"
            onSuccess={handleVerifySuccess}
            // Back to the QR step — the setup is still in memory, no re-fetch.
            onBack={goToQr}
          />
        )}

        {step === "success" && (
          <MfaSuccessStep
            verifiedAt={verifiedAt}
            // Close through the modal handler so onEnabled fires for Done like it does for X/Esc.
            onDone={() => handleOpenChange(false)}
          />
        )}
      </DialogPopup>
    </Dialog>
  );
}
