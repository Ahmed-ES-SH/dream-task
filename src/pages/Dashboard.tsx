import UserProfileCard from "@/components/dashboard/UserProfileCard";
import { useTranslations } from "@/hooks/useTranslations";

export default function Dashboard() {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("dashboard.title")}
        </h1>
        <p className="text-muted-foreground">{t("dashboard.description")}</p>
      </header>

      <UserProfileCard />
    </div>
  );
}
