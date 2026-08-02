import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "@/components/ui/toast";
import { useMfaSetup } from "@/hooks/useMfa";
import { useProfile } from "@/hooks/useProfile";
import { useTranslations } from "@/hooks/useTranslations";
import { AUTH_UNAUTHORIZED_EVENT } from "@/lib/api";
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiErrorStatus,
} from "@/lib/apiErrors";
import type {
  MfaSetup,
  MfaSetupVerifyResponse,
  MfaLoginVerifyResponse,
} from "@/types/mfa";

// Enable-wizard steps.
export type MfaSetupStep = "loading" | "error" | "qr" | "verify" | "success";

type UseMfaSetupModalOptions = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Optional email from the caller: fires the setup request without waiting for /me.
  email?: string;
  // 409 MFA_ALREADY_ENABLED — setup finished in another tab.
  onAlreadyEnabled?: () => void;
  // Verify succeeded and the user finished the wizard.
  onEnabled?: (verifiedAt?: string) => void;
};

// Wizard shell logic: loading → qr → verify → success; closing early cancels silently.
export function useMfaSetupModal({
  open,
  onOpenChange,
  email: emailProp,
  onAlreadyEnabled,
  onEnabled,
}: UseMfaSetupModalOptions) {
  const t = useTranslations();
  const { data: profile } = useProfile();
  const setup = useMfaSetup();

  const [step, setStep] = useState<MfaSetupStep>("loading");
  const [setupData, setSetupData] = useState<MfaSetup | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | undefined>(undefined);

  // Closing from success still means "enabled" server-side, so onEnabled fires on any close.
  const handleOpenChange = (next: boolean) => {
    if (!next && step === "success") {
      onEnabled?.(verifiedAt);
    }
    onOpenChange(next);
  };

  // Guards async callbacks: responses after the modal closed must not touch wizard state.
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

          // Finished in another tab: close, toast, flip the card.
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
            // ACCESS_DENIED: account likely locked — show the alert and end the session.
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

  // Fresh setup request on every open, using the best available email.
  const fetchedForOpenRef = useRef(false);
  useEffect(() => {
    if (!open) {
      fetchedForOpenRef.current = false;
      return;
    }

    const resolvedEmail = emailProp ?? profile?.email;

    // Fire as soon as any email is available.
    if (resolvedEmail !== undefined && !fetchedForOpenRef.current) {
      fetchedForOpenRef.current = true;
      runSetup(resolvedEmail);
    }
    // `runSetup` is stable; the email sources are the only late-arriving inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, emailProp, profile?.email]);

  // Retry from the error step: reuses the best available email, like the first attempt.
  const retrySetup = useCallback(() => {
    runSetup(emailProp ?? profile?.email ?? "");
  }, [runSetup, emailProp, profile?.email]);

  // Verify step finished with the server confirming MFA is enabled.
  const handleVerifySuccess = useCallback(
    (result: MfaSetupVerifyResponse | MfaLoginVerifyResponse) => {
      // Context is "setup", so the result is an MfaSetupVerifyResponse; only enabled proceeds.
      const setupResult = result as MfaSetupVerifyResponse;
      if (setupResult.enabled === true) {
        setVerifiedAt(setupResult.verifiedAt);
        setStep("success");
      }
    },
    [],
  );

  return {
    step,
    setupData,
    setupError,
    verifiedAt,
    handleOpenChange,
    retrySetup,
    handleVerifySuccess,
    // Back to the QR step — the setup is still in memory, no re-fetch.
    goToQr: () => setStep("qr"),
    goToVerify: () => setStep("verify"),
  };
}
