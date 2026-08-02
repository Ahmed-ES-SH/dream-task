import { Navigate, useNavigate, useParams } from "react-router";

import MfaVerifyStep from "@/components/auth/MfaVerifyStep";
import LoginForm from "@/components/auth/LoginForm";
import {
  GatewayAmbient,
  GatewayBrandPanel,
  GatewayCorners,
} from "@/components/auth/Gateway";
import LocaleLink from "@/components/website/LocaleLink";
import { useLoginForm } from "@/hooks/useLoginForm";
import { useTranslations } from "@/hooks/useTranslations";
import { useAuth } from "@/store/auth";
import type { MfaLoginVerifyResponse } from "@/types/mfa";

export default function Login() {
  const t = useTranslations();
  const { isAuthenticated, completeLoginWithMfa } = useAuth();
  const { locale } = useParams<{ locale?: string }>();
  const navigate = useNavigate();
  const loginForm = useLoginForm();

  if (isAuthenticated) {
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
    </div>
  );
}
