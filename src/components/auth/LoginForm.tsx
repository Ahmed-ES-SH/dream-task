import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/hooks/useTranslations";
import { getApiErrorMessage, isMockMode } from "@/lib/api";
import { useAuth } from "@/store/auth";

export default function LoginForm() {
  const t = useTranslations();
  const { locale } = useParams<{ locale?: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, t("login.emailRequired"))
          .email(t("login.emailInvalid")),
        password: z
          .string()
          .min(1, t("login.passwordRequired"))
          .min(6, t("login.passwordMin"))
          .max(72),
      }),
    [t],
  );

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);

    try {
      await login(values);
      navigate(`/${locale ?? "en"}/dashboard`);
    } catch (error) {
      setApiError(getApiErrorMessage(error, t("login.failed")));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {apiError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>{t("login.failedTitle")}</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">{t("login.emailLabel")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="user@example.com"
          className="h-11"
          aria-invalid={errors.email ? true : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("login.passwordLabel")}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 pe-10"
            aria-invalid={errors.password ? true : undefined}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={
              showPassword ? t("login.hidePassword") : t("login.showPassword")
            }
          >
            {showPassword ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full text-base font-medium transition-transform hover:scale-[1.02] disabled:hover:scale-100"
      >
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? t("login.signingIn") : t("login.submit")}
      </Button>

      {isMockMode && (
        <p className="text-center text-xs text-muted-foreground">
          {t("login.demoHint")}
        </p>
      )}
    </form>
  );
}
