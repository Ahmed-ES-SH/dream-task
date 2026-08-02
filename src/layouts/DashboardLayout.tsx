import { LayoutDashboardIcon } from "lucide-react";
import { Link, Outlet, useLocation, useParams } from "react-router";

import UserMenu from "@/components/dashboard/UserMenu";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LocaleLink from "@/components/website/LocaleLink";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";

export default function DashboardLayout() {
  const t = useTranslations();
  const { locale } = useParams<{ locale?: string }>();
  const { pathname } = useLocation();

  const dashboardPath = `/${locale ?? "en"}/dashboard`;
  const isActive = pathname === dashboardPath;

  const navLinkClass = cn(
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 inset-s-0 z-40 hidden w-64 flex-col border-e bg-card lg:flex">
        <div className="flex h-16 items-center justify-between border-b px-4">
          <LocaleLink to="/dashboard" className="text-lg font-bold">
            {t("navbar.brand")}
          </LocaleLink>
          <ThemeToggle />
        </div>

        <nav className="flex-1 space-y-1 p-3">
          <Link to={dashboardPath} className={navLinkClass}>
            <LayoutDashboardIcon className="size-4" />
            {t("dashboard.title")}
          </Link>
        </nav>

        <div className="border-t p-3">
          <UserMenu variant="full" />
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
        <LocaleLink to="/dashboard" className="text-lg font-bold">
          {t("navbar.brand")}
        </LocaleLink>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <UserMenu variant="compact" />
        </div>
      </header>

      <main className="lg:ps-64">
        <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
