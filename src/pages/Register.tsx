import LocaleLink from "@/components/website/LocaleLink";
import { useTranslations } from "../hooks/useTranslations";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function SignUp() {
  const t = useTranslations();

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden bg-linear-to-br from-slate-50 via-white to-slate-100 px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_40%)]" />

      <Card className="w-full max-w-md border-0 shadow-2xl shadow-slate-200/60">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            {t("register.title")}
          </CardTitle>

          <CardDescription>{t("register.description")}</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">{t("register.nameLabel")}</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("register.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("register.passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("register.confirmPasswordLabel")}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="h-11"
              />
            </div>

            <Button type="submit" className="h-11 w-full text-base">
              {t("register.submit")}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t("register.hasAccount")}{" "}
              <LocaleLink
                to="/login"
                className="font-medium text-primary hover:underline"
              >
                {t("register.signIn")}
              </LocaleLink>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
