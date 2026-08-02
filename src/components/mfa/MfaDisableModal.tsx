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
  // Disable finished or already disabled elsewhere: flip the card and invalidate profile.
  onDisabled?: () => void;
};

// Confirmation dialog: password + TOTP confirm disable; errors map per status code.
export default function MfaDisableModal({
  open,
  onOpenChange,
  onDisabled,
}: MfaDisableModalProps) {
  const t = useTranslations();
  const disable = useMfaDisable();

  const [showPassword, setShowPassword] = useState(false);
  // Local submitting flag: mutation status updates after callbacks, leaving stale pending.
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Alert in the status region: the 429 rate-limit or 403 ACCESS_DENIED message.
  const [requestError, setRequestError] = useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const retryTimerRef = useRef<number | null>(null);

  const schema = useMemo(() => createDisableMfaSchema(t), [t]);

  const form = useForm<DisableMfaFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", code: "" },
    // Keep partial OTP input from re-running the async resolver after a server error.
    reValidateMode: "onSubmit",
  });

  // Guards async callbacks: responses after close must not touch the form.
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Clear the single rate-limit cooldown timer on unmount.
  useEffect(() => {
    return () => {
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  // Closing resets the form so every open starts fresh.
  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      form.reset();
      setRequestError(null);
      setRetryAfterSeconds(0);
      setIsSubmitting(false);
    }
  };

  const isDisabling = isSubmitting;
  const isRateLimited = retryAfterSeconds > 0;

  // Keep the submit button disabled until both fields are filled.
  const passwordValue = useWatch({ control: form.control, name: "password" });
  const codeValue = useWatch({ control: form.control, name: "code" });

  const onValid = (values: DisableMfaFormValues) => {
    // Guard the rate-limit window on auto-submit too.
    if (isDisabling || isRateLimited) return;

    setRequestError(null);
    setIsSubmitting(true);

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
          // Wrong password: inline error on the password; OTP clears, focus returns.
          form.setError("password", {
            message: t("mfa.passwordInvalid"),
          });
          form.setValue("code", "");
          form.setFocus("password");
          return;
        }

        if (status === 401 || status === 422) {
          // Invalid/expired code: inline error on the code; the password is untouched.
          form.setError("code", {
            message: getApiErrorMessage(error, t, "mfa.codeInvalid"),
          });
          return;
        }

        if (code === "MFA_NOT_ENABLED" || status === 404) {
          // Disabled in another tab: toast, close, flip the card.
          toast(t("mfa.alreadyDisabled"));
          handleOpenChange(false);
          onDisabled?.();
          return;
        }

        if (status === 403) {
          // ACCESS_DENIED: account likely locked — surface the message and end the session.
          setRequestError(getApiErrorMessage(error, t, "mfa.accessDenied"));
          window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
          return;
        }

        if (status === 429) {
          // Rate limited: honor Retry-After by disabling submit until it elapses.
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

        // Unexpected failure: surface it on the code field.
        form.setError("code", {
          message: getApiErrorMessage(error, t, "mfa.codeInvalid"),
        });
      },
      onSettled: () => {
        // Re-enable the form for every completed request, including errors.
        setIsSubmitting(false);
      },
    });
  };

  // Run the RHF submit pipeline from event handlers only.
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
                    // Dismiss the inline code error on retype, but not on the error-transition clear.
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
