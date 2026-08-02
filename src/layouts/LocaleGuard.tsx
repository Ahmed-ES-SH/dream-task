import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";

const SUPPORTED_LOCALES = ["en", "ar", "fa"] as const;
const RTL_LOCALES = new Set<string>(["ar", "fa"]);
const DEFAULT_LOCALE = "en";

export default function LocaleGuard() {
  const { pathname, search, hash } = useLocation();

  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0] ?? DEFAULT_LOCALE;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";
  }, [locale]);

  if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    return (
      <Navigate replace to={`/${DEFAULT_LOCALE}${pathname}${search}${hash}`} />
    );
  }

  return <Outlet />;
}
