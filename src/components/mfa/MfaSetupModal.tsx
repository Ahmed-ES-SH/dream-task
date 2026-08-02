import { CircleAlert, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import MfaQrStep from "@/components/mfa/MfaQrStep";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogCloseButton,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useMfaSetup } from "@/hooks/useMfa";
import { useProfile } from "@/hooks/useProfile";
import { useTranslations } from "@/hooks/useTranslations";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api";
import type { MfaSetup } from "@/types/mfa";

type MfaSetupModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // 409 MFA_ALREADY_ENABLED — setup finished in another tab (§13): the
  // Security card flips to enabled without a completed verify in this tab.
  onAlreadyEnabled?: () => void;
};

// Enable-wizard steps (spec §4.3). `verify` and `success` are rendered by
// Phase 10; until then `onContinue` leaves the wizard parked on `verify`.
type SetupStep = "loading" | "error" | "qr" | "verify" | "success";

// Wizard shell for the enable flow (spec §7.1, §4.3): fetches a fresh TOTP
// setup on open, then walks loading → qr → verify → success. Closing at any
// step cancels silently — no extra API call, the account stays disabled
// (§16 #1/#2). Base-ui owns focus trap, Esc, and focus return.
export default function MfaSetupModal({
  open,
  onOpenChange,
  onAlreadyEnabled,
}: MfaSetupModalProps) {
  const t = useTranslations();
  const { data: profile } = useProfile();
  const setup = useMfaSetup();

  const [step, setStep] = useState<SetupStep>("loading");
  const [setupData, setSetupData] = useState<MfaSetup | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Guards the async callbacks: a response arriving after the modal closed
  // must not toast or touch wizard state (silent cancel, §16 #1/#2).
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const runSetup = useCallback(
    (email: string) => {
      setStep("loading");
      setSetupData(null);
      setSetupError(null);

      setup.mutate(email, {
        onSuccess: (data) => {
          if (!openRef.current) return;
          setSetupData(data);
          setStep("qr");
        },
        onError: (error) => {
          if (!openRef.current) return;

          if (getApiErrorCode(error) === "MFA_ALREADY_ENABLED") {
            // Finished in another tab: close, toast, flip the card (§13).
            toast(t("mfa.alreadyEnabled"));
            onAlreadyEnabled?.();
            onOpenChange(false);
            return;
          }

          setSetupError(getApiErrorMessage(error, t("mfa.setupFailed")));
          setStep("error");
        },
      });
    },
    [setup, t, onAlreadyEnabled, onOpenChange],
  );

  // A fresh setup request on every open (Q4 default: new secret per call) —
  // a cancelled flow leaves the account disabled, so there is nothing to
  // resume. Fires when the profile email arrives while the modal is open,
  // but never twice per open (e.g. after a profile refetch).
  const fetchedForOpenRef = useRef(false);
  useEffect(() => {
    if (!open) {
      fetchedForOpenRef.current = false;
      return;
    }

    if (profile?.email && !fetchedForOpenRef.current) {
      fetchedForOpenRef.current = true;
      runSetup(profile.email);
    }
    // `runSetup` is stable; the profile email is the only late-arriving input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profile?.email]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Button
              type="button"
              onClick={() => runSetup(profile?.email ?? "")}
              className="h-11 w-full"
            >
              {t("mfa.setupRetry")}
            </Button>
          </div>
        )}

        {step === "qr" && setupData && (
          <MfaQrStep setup={setupData} onContinue={() => setStep("verify")} />
        )}

        {/* Phase 10 mounts MfaVerifyStep (`verify`) and MfaSuccessStep
            (`success`) here. */}
      </DialogPopup>
    </Dialog>
  );
}
