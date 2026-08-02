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

// Time the MFA status check is allowed to take before the loading screen is
// abandoned with the default error message. Guards against a hung profile
// request that would otherwise leave the spinner running forever.
const STATUS_TIMEOUT_MS = 8_000;

// Security section card. The settings page is disable-only: the card shows
// the MFA status and the "Disable MFA" action — whenever the status is not
// confirmed `disabled` (spec §6.2: `unknown` keeps the action, the modal's
// password + OTP check is the authority). Enabling is handled exclusively by
// the post-login prompt (MfaEnablePromptDialog), never from this card.
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
  // True when the status check timed out: the loading screen is replaced by
  // the default error message instead of spinning forever.
  const [timedOut, setTimedOut] = useState(false);

  // Watchdog: while the status is unresolved (profile fetch still in flight),
  // arm an 8s timer that ends the loading screen with the default error
  // message. The cleanup runs the moment the status resolves, so the timer
  // can never fire after a real signal arrived.
  useEffect(() => {
    if (mfaEnabled !== null || checkResolved) return;

    const id = window.setTimeout(() => {
      setCheckResolved(true);
      setTimedOut(true);
    }, STATUS_TIMEOUT_MS);

    return () => window.clearTimeout(id);
  }, [mfaEnabled, checkResolved]);

  // Seed from the profile when it carries MFA fields; otherwise fall back to
  // the persisted MFA state captured at sign-in (the backend's /me exposes no
  // MFA fields, so the login response is the authoritative signal). Re-seeds
  // when either signal changes (e.g. after a mutation-triggered invalidation)
  // — documented "adjust state when props change" pattern (no effect, no
  // cascading renders).
  const profileMfaState = getMfaStatus(profile) ?? mfaActive;
  if (
    profileMfaState !== null &&
    profileMfaState !== lastSyncedMfaEnabled
  ) {
    setLastSyncedMfaEnabled(profileMfaState);
    setMfaEnabled(profileMfaState);
    setTimedOut(false);
  }

  // The profile query settled without MFA fields: whatever status exists is
  // final — end the loading screen (a late timeout must not override it).
  if (!isLoading && mfaEnabled === null && !checkResolved) {
    setCheckResolved(true);
  }

  // A late successful response clears the timeout flag (the error state is
  // otherwise derived from the query below).
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

  // Disable confirmation finished (200) or MFA was already disabled (404,
  // finished in another tab): flip the card and refetch the profile (§8.1).
  // The modal owns the success/already-disabled toasts (§7.2).
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
                // Idempotent open: the flag gates MfaDisableModal from
                // Phase 11. In the `unknown` state (profile without MFA
                // fields, spec §6.2) the Disable action stays available: the
                // modal's password + OTP round-trip is the authoritative
                // check, so a user with MFA already enabled can always
                // disable it. Only a confirmed `disabled` status hides it.
                onClick={() => {
                  if (!disableOpen) setDisableOpen(true);
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Disable confirmation: success or 404 (already disabled elsewhere)
          flips the card straight to disabled (§13). */}
      <MfaDisableModal
        open={disableOpen}
        onOpenChange={setDisableOpen}
        onDisabled={handleDisabled}
      />
    </section>
  );
}
