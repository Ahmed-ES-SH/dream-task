import { Link, useLocation } from "react-router";
import { CheckIcon, GlobeIcon } from "lucide-react";

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
import LocaleLink from "./LocaleLink";

const LOCALES: LocaleType[] = ["en", "ar", "fa"];

export default function Navbar() {
  const t = useTranslations();
  const locale = useLocale() ?? "en";
  const { pathname } = useLocation();

  const currentPath = pathname.replace(/^\/(en|ar|fa)/, "");

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <LocaleLink to="/" className="text-xl font-bold">
          {t("navbar.brand")}
        </LocaleLink>

        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Button
                variant="ghost"
                nativeButton={false}
                render={<LocaleLink to="/login" />}
              >
                {t("navbar.login")}
              </Button>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Button
                nativeButton={false}
                render={<LocaleLink to="/dashboard" />}
              >
                {t("navbar.dashboard")}
              </Button>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="gap-1.5"
                      aria-label={t("common.language")}
                    >
                      <GlobeIcon className="size-4" />
                      {t(`common.languages.${locale}`)}
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
