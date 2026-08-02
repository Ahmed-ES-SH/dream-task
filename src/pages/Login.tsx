import { Navigate, useParams } from "react-router";

import LoginForm from "@/components/auth/LoginForm";
import LocaleLink from "@/components/website/LocaleLink";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-10 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_40%)]" />

      <Card className="w-full max-w-md border-0 shadow-2xl shadow-slate-200/60 transition-all duration-300 dark:shadow-none dark:ring-1 dark:ring-border">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            {t("login.title")}
          </CardTitle>

          <CardDescription className="text-base">
            {t("login.description")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <LoginForm />

          <p className="mt-8 text-sm text-center">
            {t("login.noAccount")}{" "}
            <LocaleLink
              to="/register"
              className="font-medium underline-offset-4 hover:underline"
            >
              {t("login.createOne")}
            </LocaleLink>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
