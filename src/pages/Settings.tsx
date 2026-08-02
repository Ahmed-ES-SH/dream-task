import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

import MfaEnablePromptDialog from "@/components/mfa/MfaEnablePromptDialog";
import MfaSecurityCard from "@/components/mfa/SecurityCard";
import MfaSetupModal from "@/components/mfa/MfaSetupModal";
import { toast } from "@/components/ui/toast";
import { useProfile } from "@/hooks/useProfile";
import { useTranslations } from "@/hooks/useTranslations";
import { getMfaStatus } from "@/lib/profile";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/store/auth";

// Settings is the MFA gate page: it only supports disabling MFA (see
// MfaSecurityCard). Users whose MFA is inactive are sent here by the login
// flow (and by MfaGuard) and get the enable prompt; refusing the prompt ends
// the session and returns the user to the login page.
export default function Settings() {
  const t = useTranslations();
  const { locale } = useParams<{ locale?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, updateMfaActive } = useAuth();
  const { data: profile } = useProfile();

  const [setupOpen, setSetupOpen] = useState(false);

  // True after the user clicked "Enable MFA" or refused: the prompt stays
  // closed for the rest of this page visit (refusing logs out anyway).
  const [promptDismissed, setPromptDismissed] = useState(false);

  const mfaEnabled = getMfaStatus(profile);
  const mfaPrompt = (location.state as { mfaPrompt?: boolean } | null)
    ?.mfaPrompt;

  // Open the enable prompt after a fresh login without MFA (router state set
  // by useLoginForm) or whenever the profile reports MFA as inactive.
  const promptOpen =
    !promptDismissed && (mfaPrompt === true || mfaEnabled === false);

  // Refusing the prompt (Not now / X / Esc / outside click) ends the session:
  // the panel is unreachable without MFA, so the user must enable it on their
  // next sign-in. The redirect and toast happen immediately; the server-side
  // logout request is fire-and-forget so a slow network can't stall the UX.
  const handleRefuse = () => {
    setPromptDismissed(true);
    void logout();
    toast.warning(t("mfa.enableRequired"));
    navigate(`/${locale ?? "en"}/login`, { replace: true });
  };

  const handleEnable = () => {
    setPromptDismissed(true);
    setSetupOpen(true);
  };

  // MFA is active now (or was already active elsewhere): refresh the profile
  // first so MfaGuard sees the fresh status, then land on the dashboard.
  const goToDashboard = async () => {
    await queryClient.refetchQueries({ queryKey: ["profile"] });
    navigate(`/${locale ?? "en"}/dashboard`);
  };

  const handleEnabled = () => {
    setSetupOpen(false);
    updateMfaActive(true);
    toast.success(t("mfa.enabledToast"));
    void goToDashboard();
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("settings.title")}
        </h1>
      </header>

      <MfaSecurityCard />

      <MfaEnablePromptDialog
        open={promptOpen}
        onRefuse={handleRefuse}
        onEnable={handleEnable}
      />

      {/* 409 MFA_ALREADY_ENABLED (finished in another tab) means access is
          allowed now — refresh the profile and go to the dashboard (§13). */}
      <MfaSetupModal
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onAlreadyEnabled={() => {
          setSetupOpen(false);
          updateMfaActive(true);
          void goToDashboard();
        }}
        onEnabled={handleEnabled}
      />
    </div>
  );
}
