import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
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

  const schema = useMemo(() => createLoginSchema(t), [t]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setApiError(null);

    try {
      await login(values);
      navigate(`/${locale ?? "en"}/dashboard`);
    } catch (error) {
      setApiError(getApiErrorMessage(error, t("login.failed")));
    }
  });

  return {
    ...form,
    apiError,
    showPassword,
    togglePassword: () => setShowPassword((prev) => !prev),
    onSubmit,
  };
}
