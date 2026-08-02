import { useState } from "react";

import MfaDisableButton from "@/components/mfa/MfaDisableButton";
import MfaSetupButton from "@/components/mfa/MfaSetupButton";
import MfaSetupModal from "@/components/mfa/MfaSetupModal";
import MfaStatusBadge, {
  type MfaStatus,
} from "@/components/mfa/MfaStatusBadge";
import { useProfile } from "@/hooks/useProfile";
import { useTranslations } from "@/hooks/useTranslations";

// Security section card (spec §6.2, §8.1). Status is derived only from the
// profile response's MFA fields (`mfa.enabled`) — no invented endpoints.
// `mfaEnabled` is `null` (= `unknown`) when the profile exposes no MFA fields,
// and flips locally after successful enable/disable mutations (Phases 9/11).
export default function MfaSecurityCard() {
  const t = useTranslations();
  const { data: profile } = useProfile();
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [lastSyncedMfaEnabled, setLastSyncedMfaEnabled] = useState<
    boolean | undefined
  >(undefined);
  const [setupOpen, setSetupOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);

  // Seed from the profile when it carries MFA fields; otherwise stay `null`.
  // Re-seeds when the profile's field appears or changes (e.g. after a
  // mutation-triggered invalidation) — documented "adjust state when props
  // change" pattern (no effect, no cascading renders).
  const profileMfaEnabled = profile?.mfa?.enabled;
  if (
    profileMfaEnabled !== undefined &&
    profileMfaEnabled !== lastSyncedMfaEnabled
  ) {
    setLastSyncedMfaEnabled(profileMfaEnabled);
    setMfaEnabled(profileMfaEnabled);
  }

  const status: MfaStatus =
    mfaEnabled === null ? "unknown" : mfaEnabled ? "enabled" : "disabled";

  // Unknown → both actions available; enabled → only "Disable MFA";
  // disabled → only "Enable MFA" (spec §6.2).
  const showSetupButton = mfaEnabled !== true;
  const showDisableButton = mfaEnabled !== false;

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

      <div className="mt-4 flex items-center gap-2">
        {status !== "unknown" && <MfaStatusBadge status={status} />}
        <p className="text-sm text-muted-foreground">{statusDescription}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {showSetupButton && (
          <MfaSetupButton
            // Idempotent open: the flag gates MfaSetupModal from Phase 9.
            onClick={() => {
              if (!setupOpen) setSetupOpen(true);
            }}
          />
        )}
        {showDisableButton && (
          <MfaDisableButton
            // Idempotent open: the flag gates MfaDisableModal from Phase 11.
            onClick={() => {
              if (!disableOpen) setDisableOpen(true);
            }}
          />
        )}
      </div>

      {/* 409 MFA_ALREADY_ENABLED (finished in another tab) flips the card
          straight to enabled (§13). */}
      <MfaSetupModal
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onAlreadyEnabled={() => setMfaEnabled(true)}
      />
    </section>
  );
}
