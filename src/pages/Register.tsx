import {
  GatewayAmbient,
  GatewayBrandPanel,
  GatewayCorners,
} from "../components/auth/Gateway";
import LocaleLink from "../components/website/LocaleLink";
import { useTranslations } from "../hooks/useTranslations";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function SignUp() {
  const t = useTranslations();

  return (
    <div className="relative grid min-h-[calc(100vh-4rem)] overflow-hidden bg-gateway lg:grid-cols-2">
      <GatewayAmbient />

      <GatewayBrandPanel description={t("register.description")} />

      <section className="relative flex items-center justify-center px-4 py-12 lg:px-12">
        <div className="relative w-full max-w-md">
          <GatewayCorners />

          <div className="pt-14 pb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gateway-fg">
              {t("register.title")}
            </h1>
            <p className="mt-2 text-sm text-gateway-muted lg:hidden">
              {t("register.description")}
            </p>

            <div className="mt-8 text-start">
              <form className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-xs font-medium tracking-wider text-gateway-muted uppercase"
                  >
                    {t("register.nameLabel")}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    className="h-11 rounded-none border-gateway-border bg-gateway-fg/5 text-gateway-fg caret-gateway-fg placeholder:text-gateway-fg/40 focus-visible:border-gateway-fg/60 focus-visible:ring-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-medium tracking-wider text-gateway-muted uppercase"
                  >
                    {t("register.emailLabel")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    className="h-11 rounded-none border-gateway-border bg-gateway-fg/5 text-gateway-fg caret-gateway-fg placeholder:text-gateway-fg/40 focus-visible:border-gateway-fg/60 focus-visible:ring-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-xs font-medium tracking-wider text-gateway-muted uppercase"
                  >
                    {t("register.passwordLabel")}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-11 rounded-none border-gateway-border bg-gateway-fg/5 text-gateway-fg caret-gateway-fg placeholder:text-gateway-fg/40 focus-visible:border-gateway-fg/60 focus-visible:ring-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-xs font-medium tracking-wider text-gateway-muted uppercase"
                  >
                    {t("register.confirmPasswordLabel")}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="h-11 rounded-none border-gateway-border bg-gateway-fg/5 text-gateway-fg caret-gateway-fg placeholder:text-gateway-fg/40 focus-visible:border-gateway-fg/60 focus-visible:ring-0"
                  />
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-none bg-gateway-fg text-base font-semibold tracking-wide text-gateway transition-colors hover:bg-gateway-fg/90"
                >
                  {t("register.submit")}
                </Button>
              </form>
            </div>

            <p className="mt-8 text-sm text-center text-gateway-muted">
              {t("register.hasAccount")}{" "}
              <LocaleLink
                to="/login"
                className="font-medium text-gateway-fg underline-offset-4 hover:underline"
              >
                {t("register.signIn")}
              </LocaleLink>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
