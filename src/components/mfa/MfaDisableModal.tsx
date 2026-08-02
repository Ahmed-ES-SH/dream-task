import { CircleAlert, Loader2 } from "lucide-react";

import MfaDisableCodeField from "@/components/mfa/MfaDisableCodeField";
import MfaDisablePasswordField from "@/components/mfa/MfaDisablePasswordField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMfaDisableModal } from "@/hooks/useMfaDisableModal";
import { useTranslations } from "@/hooks/useTranslations";

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
  const {
    form,
    showPassword,
    requestError,
    isDisabling,
    isRateLimited,
    passwordValue,
    codeValue,
    togglePassword,
    handleOpenChange,
    handleSubmit,
  } = useMfaDisableModal({ open, onOpenChange, onDisabled });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="w-full sm:max-w-md">
        <DialogTitle>{t("mfa.disableTitle")}</DialogTitle>
        <DialogDescription>{t("mfa.disableWarning")}</DialogDescription>
        <DialogCloseButton />

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <MfaDisablePasswordField
            form={form}
            disabled={isDisabling}
            showPassword={showPassword}
            onTogglePassword={togglePassword}
          />

          <MfaDisableCodeField
            form={form}
            disabled={isDisabling}
            onSubmitComplete={handleSubmit}
          />

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
