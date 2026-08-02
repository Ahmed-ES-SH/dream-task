import { useTranslations } from "../hooks/useTranslations";

export default function Home() {
  const t = useTranslations();

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <h1>{t("home.title")}</h1>
    </div>
  );
}
