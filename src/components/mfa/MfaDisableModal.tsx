import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import OtpInput from "@/components/mfa/OtpInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { useMfaDisable } from "@/hooks/useMfa";
import { useTranslations } from "@/hooks/useTranslations";
import {
  AUTH_UNAUTHORIZED_EVENT,
  getRetryAfterSeconds,
} from "@/lib/api";
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiErrorStatus,
} from "@/lib/apiErrors";
import {
  createDisableMfaSchema,
  type DisableMfaFormValues,
} from "@/validations/mfa";

type MfaDisableModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Disable finished (200) or already disabled elsewhere (404): the Security
  // card flips to disabled and invalidates `["profile"]` (§8.1, §13).
  onDisabled?: () => void;
};

// Confirmation dialog for disabling MFA (spec §7.2, §12.1): the current
// password + a TOTP code confirm `POST /v1/auth/mfa/disable`. Error mapping
// per status code (§13): 401 → inline error on the password (OTP cleared,
// dialog stays open); 422 → inline error on the code (only the OTP clears,
// the password is preserved — §16 #11); 404 → "already disabled" toast,
// close, `onDisabled`; 429 → rate-limit alert honoring `Retry-After` (§12.3).
export default function MfaDisableModal({
  open,
  onOpenChange,
  onDisabled,
}: MfaDisableModalProps) {
  const t = useTranslations();
  const disable = useMfaDisable();

  const [showPassword, setShowPassword] = useState(false);
  // Alert shown in the dialog's status region: the 429 rate-limit message
  // (with Retry-After) or a 403 ACCESS_DENIED message (§13).
  const [requestError, setRequestError] = useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const retryTimerRef = useRef<number | null>(null);

  const schema = useMemo(() => createDisableMfaSchema(t), [t]);

  const form = useForm<DisableMfaFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", code: "" },
  });

  // Guards the async callbacks: a response arriving after the modal closed
  // must not toast or touch the form (silent cancel, §16 #1/#2).
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Clear the single rate-limit cooldown timer on unmount (no ticker, §12.3).
  useEffect(() => {
    return () => {
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  // Closing resets the form — cleared fields and errors, no stale cooldown —
  // so every open starts fresh (success/404 closes route through here too).
  // Runs in an event handler, not an effect (§7.2).
  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      form.reset();
      setRequestError(null);
      setRetryAfterSeconds(0);
    }
  };

  const isDisabling = disable.isPending;
  const isRateLimited = retryAfterSeconds > 0;

  // Keep the submit button disabled until both fields are filled (auto-submit
  // at 6 digits may fire before the button is even reachable). `useWatch`
  // instead of `form.watch` — React Compiler-safe (§compiler).
  const passwordValue = useWatch({ control: form.control, name: "password" });
  const codeValue = useWatch({ control: form.control, name: "code" });

  const onValid = (values: DisableMfaFormValues) => {
    // OtpInput auto-submits at 6 digits — guard the rate-limit window here
    // too, not just on the button (§12.3, §16 #10).
    if (isDisabling || isRateLimited) return;

    setRequestError(null);

    disable.mutate(values, {
      onSuccess: () => {
        if (!openRef.current) return;
        toast.success(t("mfa.disabledToast"));
        handleOpenChange(false);
        onDisabled?.();
      },
      onError: (error) => {
        if (!openRef.current) return;
        const status = getApiErrorStatus(error);
        const code = getApiErrorCode(error);

        if (status === 401 && code !== "MFA_CODE_INVALID") {
          // Wrong password (§13): inline error on the password field, the OTP
          // clears, focus returns to the password, the dialog stays open.
          form.setError("password", {
            message: t("mfa.passwordInvalid"),
          });
          form.setValue("code", "");
          form.setFocus("password");
          return;
        }

        if (status === 401 || status === 422) {
          // Invalid code (401 MFA_CODE_INVALID) or invalid/expired code (422,
          // §13): inline error on the code field; OtpInput clears the cells
          // and refocuses cell 0 on the error transition (§12.2). The
          // password is never touched (§16 #11).
          form.setError("code", {
            message: getApiErrorMessage(error, t, "mfa.codeInvalid"),
          });
          return;
        }

        if (code === "MFA_NOT_ENABLED" || status === 404) {
          // Disabled in another tab (§13): toast, close, flip the card.
          toast(t("mfa.alreadyDisabled"));
          handleOpenChange(false);
          onDisabled?.();
          return;
        }

        if (status === 403) {
          // ACCESS_DENIED on a protected mutation: the account is likely
          // locked — surface the mapped message and end the session (§13).
          setRequestError(getApiErrorMessage(error, t, "mfa.accessDenied"));
          window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
          return;
        }

        if (status === 429) {
          // Rate limited: show the mapped message, and honor Retry-After
          // by disabling the submit button until the window elapses (§12.3).
          setRequestError(getApiErrorMessage(error, t, "mfa.rateLimited"));

          const seconds = getRetryAfterSeconds(error);
          if (seconds > 0) {
            setRetryAfterSeconds(seconds);
            retryTimerRef.current = window.setTimeout(() => {
              setRetryAfterSeconds(0);
            }, seconds * 1000);
          }

          return;
        }

        // Unexpected failure: surface it on the code field like the shared
        // verify step's generic branch.
        form.setError("code", {
          message: getApiErrorMessage(error, t, "mfa.codeInvalid"),
        });
      },
    });
  };

  // Runs the RHF submit pipeline from event handlers only (form submit and
  // OtpInput auto-submit) — never during render, so no ref reads at render
  // time. Shared by both entry points so the validation path stays identical.
  const handleSubmit = () => {
    void form.handleSubmit(onValid)();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="w-full sm:max-w-md">
        <DialogTitle>{t("mfa.disableTitle")}</DialogTitle>
        <DialogDescription>{t("mfa.disableWarning")}</DialogDescription>
        <DialogCloseButton />

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="mfa-disable-password">
              {t("login.passwordLabel")}
            </Label>
            <div className="relative">
              <Input
                id="mfa-disable-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                autoFocus
                disabled={isDisabling}
                aria-invalid={form.formState.errors.password ? true : undefined}
                className="h-11 w-full pe-10"
                {...form.register("password", {
                  // Dismiss the inline 401 error as soon as the user retypes.
                  onChange: () => {
                    if (form.formState.errors.password) {
                      form.clearErrors("password");
                    }
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
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
            {form.formState.errors.password && (
              <p className="text-sm text-destructive" role="alert">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <OtpInput
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    // Dismiss the inline code error as soon as the user
                    // retypes — but not on OtpInput's own error-transition
                    // clear (""), so the message survives until the retype
                    // or the next submit (§12.2).
                    if (value !== "") form.clearErrors("code");
                  }}
                  error={fieldState.error !== undefined}
                  disabled={isDisabling}
                  onSubmitComplete={handleSubmit}
                />
              )}
            />
            <div aria-live="polite">
              {form.formState.errors.code && (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.code.message}
                </p>
              )}
            </div>
          </div>

          <div aria-live="polite">
            {requestError && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{requestError}</AlertDescription>
              </Alert>
            )}
          </div>

          <Button
            type="submit"
            variant="destructive"
            disabled={
              isDisabling ||
              isRateLimited ||
              !passwordValue ||
              codeValue.length !== 6
            }
            className="h-11 w-full"
          >
            {isDisabling && <Loader2 className="animate-spin" />}
            {t("mfa.disableSubmit")}
          </Button>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
