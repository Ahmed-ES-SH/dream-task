import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";

import { useTranslations } from "@/hooks/useTranslations";
import { getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { createLoginSchema, type LoginFormValues } from "@/validations/auth";

export function useLoginForm() {
  const t = useTranslations();
  const { locale } = useParams<{ locale?: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");

  const schema = useMemo(() => createLoginSchema(t), [t]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setApiError(null);

    try {
      const result = await login(values);

      if (result.status === "mfa_required") {
        setMfaToken(result.mfaToken);
        setLoginEmail(values.email);
        setStep("mfa");
        return;
      }

      navigate(`/${locale ?? "en"}/dashboard`);
    } catch (error) {
      setApiError(getApiErrorMessage(error, t("login.failed")));
    }
  });

  const resetToCredentials = useCallback(() => {
    setMfaToken(null);
    setStep("credentials");
  }, []);

  // A 401 on login-verify means the mfa_token expired (§11.5, §13): discard
  // the challenge and return to the credentials step with an alert.
  const handleChallengeExpired = useCallback(() => {
    setApiError(t("mfa.challengeExpired"));
    setMfaToken(null);
    setStep("credentials");
  }, [t]);

  return {
    ...form,
    apiError,
    showPassword,
    step,
    mfaToken,
    loginEmail,
    togglePassword: () => setShowPassword((prev) => !prev),
    resetToCredentials,
    handleChallengeExpired,
    onSubmit,
  };
}
