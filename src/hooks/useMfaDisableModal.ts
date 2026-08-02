import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { toast } from "@/components/ui/toast";
import { useMfaDisable } from "@/hooks/useMfa";
import { useTranslations } from "@/hooks/useTranslations";
import { AUTH_UNAUTHORIZED_EVENT, getRetryAfterSeconds } from "@/lib/api";
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiErrorStatus,
} from "@/lib/apiErrors";
import {
  createDisableMfaSchema,
  type DisableMfaFormValues,
} from "@/validations/mfa";

type UseMfaDisableModalOptions = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Disable finished or already disabled elsewhere: flip the card and invalidate profile.
  onDisabled?: () => void;
};

// Confirmation dialog logic: password + TOTP confirm disable; errors map per status code.
export function useMfaDisableModal({
  open,
  onOpenChange,
  onDisabled,
}: UseMfaDisableModalOptions) {
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

  return {
    form,
    showPassword,
    requestError,
    isDisabling,
    isRateLimited,
    passwordValue,
    codeValue,
    togglePassword: () => setShowPassword((prev) => !prev),
    handleOpenChange,
    handleSubmit,
  };
}
