import { useTranslations } from "@/hooks/useTranslations";

export default function Settings() {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("settings.title")}
        </h1>
      </header>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">{t("settings.securityTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.securityDescription")}
        </p>
      </section>
    </div>
  );
}
