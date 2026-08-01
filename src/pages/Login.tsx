import { Navigate, useParams } from "react-router";

import LoginForm from "@/components/auth/LoginForm";
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
    <div className="relative grid min-h-[calc(100vh-4rem)] overflow-hidden bg-primary lg:grid-cols-2">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary-foreground/10 blur-3xl motion-safe:animate-[gateway-glow_6s_ease-in-out_infinite] lg:hidden" />
        <div className="absolute top-1/2 left-1/2 hidden h-[65vh] w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground/15 blur-3xl motion-safe:animate-[gateway-glow_6s_ease-in-out_infinite] lg:block" />
        <div className="absolute inset-y-10 left-1/2 hidden w-px -translate-x-1/2 bg-linear-to-b from-transparent via-primary-foreground/25 to-transparent lg:block" />
      </div>

      <section className="relative hidden flex-col justify-between p-12 lg:flex">
        <p className="text-xs font-medium tracking-[0.35em] text-primary-foreground/50 uppercase">
          {t("navbar.brand")}
        </p>

        <div>
          <h2 className="max-w-lg text-[clamp(4.5rem,9vw,9rem)] leading-[0.95] font-bold tracking-tighter text-primary-foreground [mask-image:linear-gradient(to_bottom,black_60%,transparent_95%)]">
            {t("navbar.brand")}
          </h2>
          <p className="mt-8 max-w-sm text-base text-primary-foreground/60">
            {t("login.description")}
          </p>
        </div>

        <p className="text-xs text-primary-foreground/40">
          {t("footer.copyright")}
        </p>
      </section>

      <section className="relative flex items-center justify-center px-4 py-12 lg:px-12">
        <div className="relative w-full max-w-md">
          <span
            aria-hidden="true"
            className="absolute top-0 start-0 size-5 border-t border-s border-primary-foreground/60 motion-safe:animate-[mark-in_0.5s_ease-out_both]"
          />
          <span
            aria-hidden="true"
            className="absolute top-0 end-0 size-5 border-t border-e border-primary-foreground/60 motion-safe:animate-[mark-in_0.5s_ease-out_both] [animation-delay:100ms]"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-0 start-0 size-5 border-b border-s border-primary-foreground/60 motion-safe:animate-[mark-in_0.5s_ease-out_both] [animation-delay:200ms]"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-0 end-0 size-5 border-b border-e border-primary-foreground/60 motion-safe:animate-[mark-in_0.5s_ease-out_both] [animation-delay:300ms]"
          />

          <div className="pt-14 pb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-primary-foreground">
              {t("login.title")}
            </h1>
            <p className="mt-2 text-sm text-primary-foreground/60 lg:hidden">
              {t("login.description")}
            </p>

            <div className="mt-8 text-start">
              <LoginForm />
            </div>

            <p className="mt-8 text-sm text-center text-primary-foreground/60">
              {t("login.noAccount")}{" "}
              <LocaleLink
                to="/register"
                className="font-medium text-primary-foreground underline-offset-4 hover:underline"
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
