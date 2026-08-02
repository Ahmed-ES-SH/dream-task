import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";

import { getApiErrorKey } from "@/lib/apiErrors";
import { getMfaStatus } from "@/lib/profile";
import { useAuth } from "@/store/auth";
import type { StringKey } from "@/types/profile";
import { createLoginSchema, type LoginFormValues } from "@/validations/auth";

const loginSchema = createLoginSchema();

export function useLoginForm() {
  const { locale } = useParams<{ locale?: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();
  // The translation key of the current API error (not its text): it is
  // translated at render time so it stays in sync when the user switches
  // language while an error is visible.
  const [apiErrorKey, setApiErrorKey] = useState<StringKey | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  // Open while the MFA-less user must enable MFA before accessing the panel:
  // the enable prompt (and the setup wizard) render on the login page itself
  // instead of redirecting to the settings gate.
  const [mfaPromptOpen, setMfaPromptOpen] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setApiErrorKey(null);

    try {
      const result = await login(values);

      if (result.status === "mfa_required") {
        setMfaToken(result.mfaToken);
        setLoginEmail(values.email);
        setStep("mfa");
        return;
      }

      // The dashboard fetches the current user via /me, which only works for
      // sessions with a verified MFA setup. When the login response reports
      // MFA as inactive, keep the user on the login page and open the enable
      // prompt there instead of redirecting.
      const mfaActive = getMfaStatus(result.user);

      if (mfaActive === false) {
        // Keep MFA-less users on the login page and open the enable prompt
        // there (§ UX: "enable MFA or you can't use the panel").
        setMfaPromptOpen(true);
        return;
      }

      navigate(`/${locale ?? "en"}/dashboard`);
    } catch (error) {
      setApiErrorKey(getApiErrorKey(error, "login.failed"));
    }
  });

  const resetToCredentials = useCallback(() => {
    setMfaToken(null);
    setStep("credentials");
  }, []);

  // A 401 on login-verify means the mfa_token expired (§11.5, §13): discard
  // the challenge and return to the credentials step with an alert.
  const handleChallengeExpired = useCallback(() => {
    setApiErrorKey("mfa.challengeExpired");
    setMfaToken(null);
    setStep("credentials");
  }, []);

  return {
    ...form,
    apiErrorKey,
    showPassword,
    step,
    mfaToken,
    loginEmail,
    mfaPromptOpen,
    setMfaPromptOpen,
    togglePassword: () => setShowPassword((prev) => !prev),
    resetToCredentials,
    handleChallengeExpired,
    onSubmit,
  };
}
