import { CircleAlert, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
import { toast } from "@/components/ui/toast";
import { useMfaSetup } from "@/hooks/useMfa";
import { useProfile } from "@/hooks/useProfile";
import { useTranslations } from "@/hooks/useTranslations";
import {
  AUTH_UNAUTHORIZED_EVENT,
} from "@/lib/api";
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiErrorStatus,
} from "@/lib/apiErrors";
import type { MfaSetup, MfaSetupVerifyResponse } from "@/types/mfa";

type MfaSetupModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Optional email from the caller (e.g. the login form): used immediately
  // to fire the setup request without waiting for /me — critical on the login
  // page where /me is blocked for MFA-less sessions (§8.1).
  email?: string;
  // 409 MFA_ALREADY_ENABLED — setup finished in another tab (§13): the
  // Security card flips to enabled without a completed verify in this tab.
  onAlreadyEnabled?: () => void;
  // Verify succeeded and the user finished the wizard (Done, X, or Esc):
  // the Security card flips to enabled and invalidates `["profile"]` (§8.1).
  onEnabled?: (verifiedAt?: string) => void;
};

// Enable-wizard steps (spec §4.3).
type SetupStep = "loading" | "error" | "qr" | "verify" | "success";

// Wizard shell for the enable flow (spec §7.1, §4.3): fetches a fresh TOTP
// setup on open, then walks loading → qr → verify → success. Closing at any
// step cancels silently — no extra API call, the account stays disabled
// (§16 #1/#2). Base-ui owns focus trap, Esc, and focus return.
export default function MfaSetupModal({
  open,
  onOpenChange,
  email: emailProp,
  onAlreadyEnabled,
  onEnabled,
}: MfaSetupModalProps) {
  const t = useTranslations();
  const { data: profile } = useProfile();
  const setup = useMfaSetup();

  const [step, setStep] = useState<SetupStep>("loading");
  const [setupData, setSetupData] = useState<MfaSetup | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | undefined>(undefined);

  // Closing from the success step still means "enabled" server-side, so
  // `onEnabled` fires on any close (Done, X, or Esc) — the card flips and
  // the profile refetches (§8.1). Every other step cancels silently (§16
  // #1/#2) because the enable never completed.
  const handleOpenChange = (next: boolean) => {
    if (!next && step === "success") {
      onEnabled?.(verifiedAt);
    }
    onOpenChange(next);
  };

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

          // Finished in another tab: close, toast, flip the card (§13). The
          // status check is a fallback for backends that omit the error code.
          const status = getApiErrorStatus(error);
          const isAlreadyEnabled =
            getApiErrorCode(error) === "MFA_ALREADY_ENABLED" || status === 409;

          if (isAlreadyEnabled) {
            toast(t("mfa.alreadyEnabled"));
            onAlreadyEnabled?.();
            onOpenChange(false);
            return;
          }

          if (status === 403) {
            // ACCESS_DENIED on a protected mutation: the account is likely
            // locked — show the mapped alert and end the session (§13).
            setSetupError(getApiErrorMessage(error, t, "mfa.setupFailed"));
            setStep("error");
            window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
            return;
          }

          setSetupError(getApiErrorMessage(error, t, "mfa.setupFailed"));
          setStep("error");
        },
      });
    },
    [setup, t, onAlreadyEnabled, onOpenChange],
  );

  // A fresh setup request on every open (Q4 default: new secret per call) —
  // a cancelled flow leaves the account disabled, so there is nothing to
  // resume. Fires immediately with the best available email: the caller-
  // provided prop (login email on the login page) wins, then the profile
  // email, then an empty label (the backend accepts it). Never fires twice
  // per open (e.g. after a late profile arrival).
  const fetchedForOpenRef = useRef(false);
  useEffect(() => {
    if (!open) {
      fetchedForOpenRef.current = false;
      return;
    }

    const resolvedEmail = emailProp ?? profile?.email;

    // Fire as soon as any email is available — no need to wait for /me
    // when the caller already knows the login email.
    if (resolvedEmail !== undefined && !fetchedForOpenRef.current) {
      fetchedForOpenRef.current = true;
      runSetup(resolvedEmail);
    }
    // `runSetup` is stable; the email sources are the only late-arriving inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, emailProp, profile?.email]);

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
            <Button
              type="button"
              onClick={() => runSetup(emailProp ?? profile?.email ?? "")}
              className="h-11 w-full"
            >
              {t("mfa.setupRetry")}
            </Button>
          </div>
        )}

        {step === "qr" && setupData && (
          <MfaQrStep setup={setupData} onContinue={() => setStep("verify")} />
        )}

        {step === "verify" && (
          <MfaVerifyStep
            context="setup"
            onSuccess={(result) => {
              // `context` is statically "setup", so the shared step always
              // emits an MfaSetupVerifyResponse here (spec §10.3). The server
              // only returns 200 with `enabled: true`; anything else leaves
              // the wizard on the verify step (§4.3).
              const setupResult = result as MfaSetupVerifyResponse;
              if (setupResult.enabled === true) {
                setVerifiedAt(setupResult.verifiedAt);
                setStep("success");
              }
            }}
            // Back to the QR step — the setup is still in memory, no re-fetch.
            onBack={() => setStep("qr")}
          />
        )}

        {step === "success" && (
          <MfaSuccessStep
            verifiedAt={verifiedAt}
            // Just close — handleOpenChange fires `onEnabled` for the
            // success step, so Done and X/Esc behave identically.
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogPopup>
    </Dialog>
  );
}
