import { useTranslations } from "../../hooks/useTranslations";
import { Button } from "../ui/button";
import LocaleLink from "./LocaleLink";

const ROLES = [
  "engineering",
  "design",
  "data",
  "product",
  "marketing",
  "support",
] as const;

export default function HeroSection() {
  const t = useTranslations();

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 end-[-10rem] size-[34rem] rounded-full bg-foreground/[0.06] blur-3xl"
      />

      <div className="container mx-auto px-4 py-16 sm:py-24">
        <span className="inline-flex border border-border px-3 py-1 text-xs font-medium tracking-[0.25em] text-muted-foreground uppercase">
          {t("home.eyebrow")}
        </span>

        <h1 className="mt-8 max-w-4xl text-[clamp(2.75rem,7vw,5.5rem)] leading-[1.02] font-bold tracking-tight text-foreground [mask-image:linear-gradient(to_bottom,black_75%,transparent)]">
          {t("home.headline")}
        </h1>

        <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground">
          {t("home.description")}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            nativeButton={false}
            render={<LocaleLink to="/register" />}
            className="h-11 px-6"
          >
            {t("home.ctaStart")}
          </Button>

          <Button
            size="lg"
            variant="ghost"
            nativeButton={false}
            render={<LocaleLink to="/login" />}
            className="h-11 px-6"
          >
            {t("home.ctaSignIn")}
          </Button>
        </div>

        <ul className="mt-16 flex flex-wrap items-center sm:mt-20">
          {ROLES.map((role, i) => (
            <li key={role} className="flex items-center">
              <span className="px-5 py-2 text-sm font-medium tracking-wide text-muted-foreground transition-colors first:ps-0 hover:text-foreground">
                {t(`home.roles.${role}`)}
              </span>
              {i < ROLES.length - 1 && (
                <span aria-hidden="true" className="h-4 w-px bg-border" />
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
