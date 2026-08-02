import MfaSecurityCard from "@/components/mfa/SecurityCard";
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

      <MfaSecurityCard />
    </div>
  );
}
