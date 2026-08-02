import SharedMfaVerifyStep from "@/components/mfa/MfaVerifyStep";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/useTranslations";
import { maskEmail } from "@/lib/format";
import type { MfaLoginVerifyResponse } from "@/types/mfa";

type AuthMfaVerifyStepProps = {
  email: string;
  mfaToken: string;
  onSuccess: (result: MfaLoginVerifyResponse) => void;
  onBack: () => void;
  // Forwarded to the shared step: fires when the mfa_token expires (401).
  onChallengeExpired?: () => void;
};

// Login-page challenge step (spec §6.1, §8.1): a thin wrapper around the
// shared code-entry step that adds the gateway-styled header (title,
// description, masked email + "Not you?") and the "Back to sign in" control.
export default function AuthMfaVerifyStep({
  email,
  mfaToken,
  onSuccess,
  onBack,
  onChallengeExpired,
}: AuthMfaVerifyStepProps) {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gateway-fg">
          {t("login.mfaTitle")}
        </h1>
        <p className="mt-2 text-sm text-gateway-muted">
          {t("login.mfaDescription")}
        </p>
      </div>

      <p className="text-sm text-gateway-muted">
        {maskEmail(email)}{" "}
        <button
          type="button"
          onClick={onBack}
          className="font-medium text-gateway-fg underline-offset-4 transition-colors hover:underline"
        >
          {t("login.mfaNotYou")}
        </button>
      </p>

      {/* The gateway panel is always dark, so the shared step (which uses
          theme tokens) is scoped to the dark token set to stay legible on it. */}
      <div className="dark">
        <SharedMfaVerifyStep
          context="login"
          mfaToken={mfaToken}
          onSuccess={(result) =>
            // context is statically "login", so the shared step always emits
            // an MfaLoginVerifyResponse here (spec §10.3).
            onSuccess(result as MfaLoginVerifyResponse)
          }
          onChallengeExpired={onChallengeExpired}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="w-full text-gateway-muted hover:bg-gateway-fg/5 hover:text-gateway-fg"
      >
        {t("mfa.backToSignIn")}
      </Button>
    </div>
  );
}
