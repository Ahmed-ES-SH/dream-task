import { useTranslation } from "../../hooks/useTranslations";

export default function Footer() {
  const t = useTranslation;

  return (
    <footer className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
      {t("footer.copyright")}
    </footer>
  );
}
