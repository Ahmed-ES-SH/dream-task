import { useParams } from "react-router";



export type LocaleType = "en" | "ar" | "fa";

export type ParamsLocaleType = Promise<{ locale: LocaleType }>;

export function useLocale() {
 const { locale } = useParams<{ locale?: LocaleType }>();
  return locale as LocaleType;
}