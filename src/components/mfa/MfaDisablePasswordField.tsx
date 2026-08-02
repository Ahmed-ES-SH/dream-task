import { EyeIcon, EyeOffIcon } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/hooks/useTranslations";
import type { DisableMfaFormValues } from "@/validations/mfa";

type MfaDisablePasswordFieldProps = {
  form: UseFormReturn<DisableMfaFormValues>;
  disabled: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
};

// Password field of the disable confirmation dialog, with show/hide toggle and inline error.
export default function MfaDisablePasswordField({
  form,
  disabled,
  showPassword,
  onTogglePassword,
}: MfaDisablePasswordFieldProps) {
  const t = useTranslations();
  const passwordError = form.formState.errors.password;

  return (
    <div className="space-y-2">
      <Label htmlFor="mfa-disable-password">{t("login.passwordLabel")}</Label>
      <div className="relative">
        <Input
          id="mfa-disable-password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          autoFocus
          disabled={disabled}
          aria-invalid={passwordError ? true : undefined}
          className="h-11 w-full pe-10"
          {...form.register("password", {
            // Dismiss the inline 401 error as soon as the user retypes.
            onChange: () => {
              if (passwordError) {
                form.clearErrors("password");
              }
            },
          })}
        />
        <button
          type="button"
          onClick={onTogglePassword}
          aria-label={
            showPassword ? t("login.hidePassword") : t("login.showPassword")
          }
          className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground transition-colors hover:text-foreground"
        >
          {showPassword ? (
            <EyeOffIcon className="size-4" />
          ) : (
            <EyeIcon className="size-4" />
          )}
        </button>
      </div>
      {passwordError && (
        <p className="text-sm text-destructive" role="alert">
          {passwordError.message}
        </p>
      )}
    </div>
  );
}
