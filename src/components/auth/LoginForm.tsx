import { CircleAlert, EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginForm } from "@/hooks/useLoginForm";
import { useTranslations } from "@/hooks/useTranslations";

type LoginFormProps = {
  loginForm: ReturnType<typeof useLoginForm>;
};

export default function LoginForm({ loginForm }: LoginFormProps) {
  const t = useTranslations();
  const {
    register,
    formState: { errors, isSubmitting },
    apiError,
    showPassword,
    togglePassword,
    onSubmit,
  } = loginForm;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {apiError && (
        <Alert
          variant="destructive"
          className="rounded-none border-red-400/40 bg-red-500/15 text-red-300"
        >
          <CircleAlert />
          <AlertTitle>{t("login.failedTitle")}</AlertTitle>
          <AlertDescription className="!text-red-300/90">
            {apiError}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label
          htmlFor="email"
          className="text-xs font-medium tracking-wider text-gateway-muted uppercase"
        >
          {t("login.emailLabel")}
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="user@example.com"
          className="h-11 rounded-none border-gateway-border bg-gateway-fg/5 text-gateway-fg caret-gateway-fg placeholder:text-gateway-fg/40 focus-visible:border-gateway-fg/60 focus-visible:ring-0"
          aria-invalid={errors.email ? true : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="text-xs font-medium tracking-wider text-gateway-muted uppercase"
        >
          {t("login.passwordLabel")}
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 rounded-none border-gateway-border bg-gateway-fg/5 pe-10 text-gateway-fg caret-gateway-fg placeholder:text-gateway-fg/40 focus-visible:border-gateway-fg/60 focus-visible:ring-0"
            aria-invalid={errors.password ? true : undefined}
            {...register("password")}
          />
          <button
            type="button"
            onClick={togglePassword}
            className="absolute inset-y-0 end-0 flex items-center pe-3 text-gateway-muted transition-colors hover:text-gateway-fg"
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
          <p className="text-sm text-red-400">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-none bg-gateway-fg text-base font-semibold tracking-wide text-gateway transition-colors hover:bg-gateway-fg/90"
      >
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? t("login.signingIn") : t("login.submit")}
      </Button>
    </form>
  );
}
