import { Link, useLocation } from "react-router";
import {
  CheckIcon,
  GlobeIcon,
  LayoutDashboardIcon,
  LogInIcon,
} from "lucide-react";

import { Button } from "../ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "../ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useTranslations } from "../../hooks/useTranslations";
import { useLocale, type LocaleType } from "../../hooks/useLocale";
import { useAuth } from "../../store/auth";
import ThemeToggle from "../theme/ThemeToggle";
import LocaleLink from "./LocaleLink";

const LOCALES: LocaleType[] = ["en", "ar", "fa"];

export default function Navbar() {
  const t = useTranslations();
  const locale = useLocale() ?? "en";
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  const currentPath = pathname.replace(/^\/(en|ar|fa)/, "");

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <LocaleLink to="/" className="text-xl font-bold">
          {t("navbar.brand")}
        </LocaleLink>

        <NavigationMenu>
          <NavigationMenuList className="gap-0.5 sm:gap-1">
            {!isAuthenticated && (
              <NavigationMenuItem>
                <Button
                  variant="ghost"
                  size="icon"
                  nativeButton={false}
                  render={<LocaleLink to="/login" />}
                  aria-label={t("navbar.login")}
                  className="sm:hidden"
                >
                  <LogInIcon className="rtl:-scale-x-100" />
                </Button>
                <Button
                  variant="ghost"
                  nativeButton={false}
                  render={<LocaleLink to="/login" />}
                  className="hidden sm:inline-flex"
                >
                  {t("navbar.login")}
                </Button>
              </NavigationMenuItem>
            )}

            <NavigationMenuItem>
              <Button
                size="icon"
                nativeButton={false}
                render={<LocaleLink to="/dashboard" />}
                aria-label={t("navbar.dashboard")}
                className="sm:hidden"
              >
                <LayoutDashboardIcon />
              </Button>
              <Button
                nativeButton={false}
                render={<LocaleLink to="/dashboard" />}
                className="hidden sm:inline-flex"
              >
                {t("navbar.dashboard")}
              </Button>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <ThemeToggle />
            </NavigationMenuItem>

            <NavigationMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="gap-1.5 px-2.5 sm:px-3"
                      aria-label={t("common.language")}
                    >
                      <GlobeIcon className="size-4" />
                      <span className="hidden sm:inline">
                        {t(`common.languages.${locale}`)}
                      </span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="min-w-36">
                  {LOCALES.map((lang) => (
                    <DropdownMenuItem
                      key={lang}
                      render={<Link to={`/${lang}${currentPath}`} />}
                    >
                      {t(`common.languages.${lang}`)}
                      {lang === locale && <CheckIcon className="ms-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}
