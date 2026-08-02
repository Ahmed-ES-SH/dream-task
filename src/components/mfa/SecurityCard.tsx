import { useEffect, useState } from "react";
import { CircleAlert, Loader2, RefreshCw } from "lucide-react";

import MfaDisableButton from "@/components/mfa/MfaDisableButton";
import MfaDisableModal from "@/components/mfa/MfaDisableModal";
import MfaStatusBadge, {
  type MfaStatus,
} from "@/components/mfa/MfaStatusBadge";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useTranslations } from "@/hooks/useTranslations";
import { getMfaStatus } from "@/lib/profile";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/store/auth";

// Timeout for the MFA status check before falling back to the default error message.
const STATUS_TIMEOUT_MS = 8_000;

// Security card: shows MFA status and Disable action; enabling is handled by the post-login prompt.
export default function MfaSecurityCard() {
  const t = useTranslations();
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const { mfaActive, updateMfaActive } = useAuth();

  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [lastSyncedMfaEnabled, setLastSyncedMfaEnabled] = useState<
    boolean | undefined
  >(undefined);
  const [disableOpen, setDisableOpen] = useState(false);
  // True once the status check has finished (success or failure).
  const [checkResolved, setCheckResolved] = useState(false);
  // True when the status check timed out.
  const [timedOut, setTimedOut] = useState(false);

  // Watchdog timer: ends the loading screen with the default error if the status check stalls.
  useEffect(() => {
    if (mfaEnabled !== null || checkResolved) return;

    const id = window.setTimeout(() => {
      setCheckResolved(true);
      setTimedOut(true);
    }, STATUS_TIMEOUT_MS);

    return () => window.clearTimeout(id);
  }, [mfaEnabled, checkResolved]);

  // Seed MFA state from the profile, falling back to the persisted login state.
  const profileMfaState = getMfaStatus(profile) ?? mfaActive;
  if (
    profileMfaState !== null &&
    profileMfaState !== lastSyncedMfaEnabled
  ) {
    setLastSyncedMfaEnabled(profileMfaState);
    setMfaEnabled(profileMfaState);
    setTimedOut(false);
  }

  // Profile settled without MFA fields: end the loading screen.
  if (!isLoading && mfaEnabled === null && !checkResolved) {
    setCheckResolved(true);
  }

  // A late successful response clears the timeout flag.
  if (!isLoading && profile !== undefined && timedOut) {
    setTimedOut(false);
  }

  // Default error message when the check failed (query error) or timed out.
  const statusError = isError || timedOut;

  // Loading screen: the MFA status is still being determined.
  if (mfaEnabled === null && !checkResolved) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <div
          role="status"
          className="flex items-center justify-center gap-2 py-8"
        >
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("mfa.statusChecking")}
          </p>
        </div>
      </section>
    );
  }

  // Status is `null` (= `unknown`) when the profile exposes no MFA fields.
  const status: MfaStatus =
    mfaEnabled === null ? "unknown" : mfaEnabled ? "enabled" : "disabled";

  // Disable finished or already disabled elsewhere: flip the card and refetch the profile.
  const handleDisabled = () => {
    setMfaEnabled(false);
    updateMfaActive(false);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  const statusDescription =
    status === "enabled"
      ? t("mfa.statusDescriptionEnabled")
      : status === "disabled"
        ? t("mfa.statusDescriptionDisabled")
        : t("mfa.statusDescriptionUnknown");

  return (
    <section className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">{t("settings.securityTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("settings.securityDescription")}
      </p>

      {statusError ? (
        <Alert variant="destructive" className="mt-4">
          <CircleAlert />
          <AlertDescription>{t("mfa.statusCheckFailed")}</AlertDescription>
          <AlertAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              className="gap-1.5"
            >
              <RefreshCw />
              {t("common.retry")}
            </Button>
          </AlertAction>
        </Alert>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2">
            {status !== "unknown" && <MfaStatusBadge status={status} />}
            <p className="text-sm text-muted-foreground">
              {statusDescription}
            </p>
          </div>

          {mfaEnabled !== false && (
            <div className="mt-4 flex flex-wrap gap-2">
              <MfaDisableButton
                // Keep the Disable action in the unknown state; the modal's check is authoritative.
                onClick={() => {
                  if (!disableOpen) setDisableOpen(true);
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Disable confirmation: success or 404 (already disabled elsewhere) flips the card. */}
      <MfaDisableModal
        open={disableOpen}
        onOpenChange={setDisableOpen}
        onDisabled={handleDisabled}
      />
    </section>
  );
}
