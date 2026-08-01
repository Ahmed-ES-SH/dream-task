import { CircleAlert, EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginForm } from "@/hooks/useLoginForm";
import { useTranslations } from "@/hooks/useTranslations";

export default function LoginForm() {
  const t = useTranslations();
  const {
    register,
    formState: { errors, isSubmitting },
    apiError,
    showPassword,
    togglePassword,
    onSubmit,
  } = useLoginForm();

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
          className="text-xs font-medium tracking-wider text-primary-foreground/60 uppercase"
        >
          {t("login.emailLabel")}
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="user@example.com"
          className="h-11 rounded-none border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground caret-primary-foreground placeholder:text-primary-foreground/40 focus-visible:border-primary-foreground/60 focus-visible:ring-0 dark:bg-primary-foreground/5"
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
          className="text-xs font-medium tracking-wider text-primary-foreground/60 uppercase"
        >
          {t("login.passwordLabel")}
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 rounded-none border-primary-foreground/20 bg-primary-foreground/5 pe-10 text-primary-foreground caret-primary-foreground placeholder:text-primary-foreground/40 focus-visible:border-primary-foreground/60 focus-visible:ring-0 dark:bg-primary-foreground/5"
            aria-invalid={errors.password ? true : undefined}
            {...register("password")}
          />
          <button
            type="button"
            onClick={togglePassword}
            className="absolute inset-y-0 end-0 flex items-center pe-3 text-primary-foreground/50 transition-colors hover:text-primary-foreground"
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
        className="h-11 w-full rounded-none bg-primary-foreground text-base font-semibold tracking-wide text-primary transition-colors hover:bg-primary-foreground/90"
      >
        {isSubmitting && <Loader2 className="animate-spin" />}
        {isSubmitting ? t("login.signingIn") : t("login.submit")}
      </Button>
    </form>
  );
}
