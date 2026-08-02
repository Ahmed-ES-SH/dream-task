import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";

import MfaEnablePromptDialog from "@/components/mfa/MfaEnablePromptDialog";
import MfaSetupModal from "@/components/mfa/MfaSetupModal";
import MfaVerifyStep from "@/components/auth/MfaVerifyStep";
import LoginForm from "@/components/auth/LoginForm";
import {
  GatewayAmbient,
  GatewayBrandPanel,
  GatewayCorners,
} from "@/components/auth/Gateway";
import { toast } from "@/components/ui/toast";
import LocaleLink from "@/components/website/LocaleLink";
import { useLoginForm } from "@/hooks/useLoginForm";
import { useTranslations } from "@/hooks/useTranslations";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/store/auth";
import type { MfaLoginVerifyResponse } from "@/types/mfa";

export default function Login() {
  const t = useTranslations();
  const {
    isAuthenticated,
    completeLoginWithMfa,
    logout,
    mfaActive,
    updateMfaActive,
  } = useAuth();
  const { locale } = useParams<{ locale?: string }>();
  const navigate = useNavigate();
  const loginForm = useLoginForm();

  // Enable wizard for MFA-less sessions: opened from the inline prompt, which
  // replaces the old redirect to the settings gate.
  const [setupOpen, setSetupOpen] = useState(false);

  // Redirect only sessions that were already authenticated when this page
  // loaded (e.g. a logged-in user visiting /login). A fresh sign-in must stay
  // here until the flow decides the destination — otherwise the render right
  // after login() stores the tokens (authenticated, but before the MFA
  // decision state is set) fires the redirect and flashes the dashboard
  // before the enable prompt can appear.
  const [wasAuthenticatedOnMount] = useState(() => isAuthenticated);

  if (wasAuthenticatedOnMount) {
    return <Navigate to={`/${locale ?? "en"}/dashboard`} replace />;
  }

  const { step, mfaToken, loginEmail, resetToCredentials, handleChallengeExpired } =
    loginForm;

  const handleMfaSuccess = async (result: MfaLoginVerifyResponse) => {
    try {
      // §11.5 handshake: store the tokens (minting the access token via the
      // refresh path when the verify response omits it), then mark the session
      // authenticated and land on the dashboard.
      await completeLoginWithMfa(result);
      navigate(`/${locale ?? "en"}/dashboard`);
    } catch {
      // The handshake failed (e.g. refresh could not mint an access token):
      // restart the sign-in flow with an alert — the user can try again.
      handleChallengeExpired();
    }
  };

  // Refusing the prompt (Not now / X / Esc / outside click) ends the session:
  // the panel is unreachable without MFA, so the user must enable it on their
  // next sign-in. The redirect and toast happen immediately; the server-side
  // logout request is fire-and-forget so a slow network can't stall the UX.
  const handleRefuseMfa = () => {
    loginForm.setMfaPromptOpen(false);
    void logout();
    toast.warning(t("mfa.enableRequired"));
  };

  const handleEnableMfa = () => {
    loginForm.setMfaPromptOpen(false);
    setSetupOpen(true);
  };

  // Closing the wizard without a completed setup (X, Esc, cancel) leaves an
  // MFA-less session: bring the enable prompt back so the user isn't stranded
  // on the login form while authenticated. On success the store has already
  // flipped `mfaActive` to true before the close, so the prompt stays shut.
  const handleSetupOpenChange = (next: boolean) => {
    setSetupOpen(next);
    if (!next && mfaActive !== true) {
      loginForm.setMfaPromptOpen(true);
    }
  };

  // MFA is active now (or was already active elsewhere): refresh the profile
  // first so the dashboard sees the fresh status, then land on it.
  const goToDashboard = async () => {
    await queryClient.refetchQueries({ queryKey: ["profile"] });
    navigate(`/${locale ?? "en"}/dashboard`);
  };

  const handleMfaEnabled = () => {
    setSetupOpen(false);
    updateMfaActive(true);
    toast.success(t("mfa.enabledToast"));
    void goToDashboard();
  };

  return (
    <div className="relative grid min-h-[calc(100vh-4rem)] overflow-hidden bg-gateway lg:grid-cols-2">
      <GatewayAmbient />

      <GatewayBrandPanel description={t("login.description")} />

      <section className="relative flex items-center justify-center px-4 py-12 lg:px-12">
        <div className="relative w-full max-w-md">
          <GatewayCorners />

          <div className="pt-14 pb-10 text-center">
            {step === "mfa" ? (
              <MfaVerifyStep
                email={loginEmail}
                mfaToken={mfaToken ?? ""}
                onSuccess={handleMfaSuccess}
                onBack={resetToCredentials}
                onChallengeExpired={handleChallengeExpired}
              />
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight text-gateway-fg">
                  {t("login.title")}
                </h1>
                <p className="mt-2 text-sm text-gateway-muted lg:hidden">
                  {t("login.description")}
                </p>

                <div className="mt-8 text-start">
                  <LoginForm loginForm={loginForm} />
                </div>

                <p className="mt-8 text-sm text-center text-gateway-muted">
                  {t("login.noAccount")}{" "}
                  <LocaleLink
                    to="/register"
                    className="font-medium text-gateway-fg underline-offset-4 hover:underline"
                  >
                    {t("login.createOne")}
                  </LocaleLink>
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Post-login MFA gate: users whose session has no verified MFA get the
          enable prompt here, on the login page — no redirect to settings. */}
      <MfaEnablePromptDialog
        open={loginForm.mfaPromptOpen}
        onRefuse={handleRefuseMfa}
        onEnable={handleEnableMfa}
      />

      {/* 409 MFA_ALREADY_ENABLED (finished in another tab) means access is
          allowed now — refresh the profile and go to the dashboard (§13). */}
      <MfaSetupModal
        open={setupOpen}
        onOpenChange={handleSetupOpenChange}
        email={loginEmail}
        onAlreadyEnabled={handleMfaEnabled}
        onEnabled={handleMfaEnabled}
      />
    </div>
  );
}
