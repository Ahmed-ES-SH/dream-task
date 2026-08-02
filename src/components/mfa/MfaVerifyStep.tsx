import { CircleAlert, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import OtpInput from "@/components/mfa/OtpInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useMfaVerify } from "@/hooks/useMfa";
import { useTranslations } from "@/hooks/useTranslations";
import {
  getApiErrorCode,
  getApiErrorKey,
  getApiErrorStatus,
} from "@/lib/apiErrors";
import { getRetryAfterSeconds } from "@/lib/api";
import type {
  MfaLoginVerifyResponse,
  MfaSetupVerifyResponse,
} from "@/types/mfa";
import type { StringKey } from "@/types/profile";
import { otpSchema } from "@/validations/mfa";

type MfaVerifyStepProps = {
  context: "setup" | "login";
  mfaToken?: string;
  onSuccess: (result: MfaSetupVerifyResponse | MfaLoginVerifyResponse) => void;
  onBack?: () => void;
  // Login context only: a 401 means the mfa_token expired — the challenge is
  // over and the caller should return to the credentials step (§11.5, §13).
  onChallengeExpired?: () => void;
};

// Shared code-entry + submit step used by the login challenge (Phase 6) and
// the enable wizard (Phase 10). Context-agnostic: `mfa_token` is only sent
// for the login context (spec §10.3, §8.1).
export default function MfaVerifyStep({
  context,
  mfaToken,
  onSuccess,
  onBack,
  onChallengeExpired,
}: MfaVerifyStepProps) {
  const t = useTranslations();
  const verify = useMfaVerify();
  const [code, setCode] = useState("");
  // The translation key of the current error (not its text): it is translated
  // at render time so it stays in sync when the user switches language.
  const [verificationErrorKey, setVerificationErrorKey] =
    useState<StringKey | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const retryTimerRef = useRef<number | null>(null);

  // Mirror of `code` for the auto-submit path: OtpInput fires
  // `onSubmitComplete` synchronously after `onChange`, before React state has
  // settled, so the submit handler reads the ref (updated synchronously)
  // instead of a stale state value.
  const codeRef = useRef("");

  // Clear the single cooldown timer on unmount (no ticker, spec §12.3).
  useEffect(() => {
    return () => {
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const isVerifying = verify.isPending;
  const isRateLimited = retryAfterSeconds > 0;

  const handleCodeChange = (value: string) => {
    codeRef.current = value;
    setCode(value);

    // Dismiss the stale inline error as soon as the user retypes.
    if (value.length > 0) {
      setVerificationErrorKey(null);
    }
  };

  const handleSubmit = () => {
    if (isVerifying || isRateLimited) return;

    const currentCode = codeRef.current;

    const parsed = otpSchema(t).safeParse(currentCode);
    if (!parsed.success) {
      setVerificationErrorKey("mfa.codeInvalid");
      return;
    }

    setVerificationErrorKey(null);

    verify.mutate(
      {
        code: currentCode,
        context,
        mfa_token: context === "login" ? mfaToken : undefined,
      },
      {
        onSuccess: (result) => onSuccess(result),
        onError: (error) => {
          const status = getApiErrorStatus(error);
          const code = getApiErrorCode(error);

          if (status === 401 && context === "login" && code !== "MFA_CODE_INVALID") {
            // Challenge expired — not a session problem. Alert via the caller
            // (which returns to the credentials step); the interceptor already
            // skips the refresh flow for login-context verify (§11.5).
            // MFA_CODE_INVALID is excluded: a wrong code is a user error with
            // its own message, not an expired challenge.
            onChallengeExpired?.();
            return;
          }

          if (status === 429) {
            // Rate limited: show the mapped message, and honor Retry-After
            // by disabling the submit button until the window elapses (§12.3).
            setVerificationErrorKey(getApiErrorKey(error, "mfa.rateLimited"));

            const seconds = getRetryAfterSeconds(error);
            if (seconds > 0) {
              setRetryAfterSeconds(seconds);
              retryTimerRef.current = window.setTimeout(() => {
                setRetryAfterSeconds(0);
              }, seconds * 1000);
            }

            return;
          }

          if (status === 422) {
            // Invalid/expired code: show the mapped message; OtpInput clears
            // the cells and refocuses cell 0 on the error transition (§12.2).
            setVerificationErrorKey(getApiErrorKey(error, "mfa.codeExpired"));
            return;
          }

          setVerificationErrorKey(getApiErrorKey(error, "mfa.codeInvalid"));
        },
      },
    );
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
      noValidate
      className="space-y-5"
    >
      <OtpInput
        value={code}
        onChange={handleCodeChange}
        error={verificationErrorKey !== null}
        disabled={isVerifying}
        autoFocus
        onSubmitComplete={handleSubmit}
      />

      <div aria-live="polite">
        {verificationErrorKey && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{t(verificationErrorKey)}</AlertDescription>
          </Alert>
        )}
      </div>

      <Button
        type="submit"
        disabled={
          isVerifying || isRateLimited || code.length !== 6
        }
        className="h-11 w-full"
      >
        {isVerifying && <Loader2 className="animate-spin" />}
        {isVerifying ? t("mfa.verifying") : t("mfa.verify")}
      </Button>

      {onBack && (
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          {t("mfa.verifyBack")}
        </Button>
      )}
    </form>
  );
}
