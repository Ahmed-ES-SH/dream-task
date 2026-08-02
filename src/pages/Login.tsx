import { Navigate, useParams } from "react-router";

import LoginForm from "@/components/auth/LoginForm";
import {
  GatewayAmbient,
  GatewayBrandPanel,
  GatewayCorners,
} from "@/components/auth/Gateway";
import LocaleLink from "@/components/website/LocaleLink";
import { useTranslations } from "@/hooks/useTranslations";
import { useAuth } from "@/store/auth";

export default function Login() {
  const t = useTranslations();
  const { isAuthenticated } = useAuth();
  const { locale } = useParams<{ locale?: string }>();

  if (isAuthenticated) {
    return <Navigate to={`/${locale ?? "en"}/dashboard`} replace />;
  }

  return (
    <div className="relative grid min-h-[calc(100vh-4rem)] overflow-hidden bg-gateway lg:grid-cols-2">
      <GatewayAmbient />

      <GatewayBrandPanel description={t("login.description")} />

      <section className="relative flex items-center justify-center px-4 py-12 lg:px-12">
        <div className="relative w-full max-w-md">
          <GatewayCorners />

          <div className="pt-14 pb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gateway-fg">
              {t("login.title")}
            </h1>
            <p className="mt-2 text-sm text-gateway-muted lg:hidden">
              {t("login.description")}
            </p>

            <div className="mt-8 text-start">
              <LoginForm />
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
          </div>
        </div>
      </section>
    </div>
  );
}
