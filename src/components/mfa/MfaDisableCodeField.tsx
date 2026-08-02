import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";

import OtpInput from "@/components/mfa/OtpInput";
import type { DisableMfaFormValues } from "@/validations/mfa";

type MfaDisableCodeFieldProps = {
  form: UseFormReturn<DisableMfaFormValues>;
  disabled: boolean;
  onSubmitComplete: () => void;
};

// TOTP field of the disable confirmation dialog, with inline error and auto-submit.
export default function MfaDisableCodeField({
  form,
  disabled,
  onSubmitComplete,
}: MfaDisableCodeFieldProps) {
  return (
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
            disabled={disabled}
            onSubmitComplete={onSubmitComplete}
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
  );
}
