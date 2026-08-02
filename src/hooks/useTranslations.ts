import { useCallback } from "react";
import { useParams } from "react-router";
import ar from "../translations/ar.json";
import en from "../translations/en.json";
import fa from "../translations/fa.json";
import type { LocaleType } from "./useLocale";

// ==============================
// Types
// ==============================

export type Messages = typeof ar;

export type NestedKeys<T> = T extends object
  ? {
      [K in keyof T & string]:
          | K
          | (T[K] extends object ? `${K}.${NestedKeys<T[K]>}` : never);
    }[keyof T & string]
  : never;

type PathValue<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? PathValue<T[K], Rest>
      : never
    : P extends keyof T
      ? T[P]
      : never;

// ==============================
// Safe Getter
// ==============================

function getNestedValue<T, P extends NestedKeys<T>>(
  obj: T,
  path: P,
): PathValue<T, P> {
  const keys = path.split(".");

  let current: unknown = obj;

  for (const key of keys) {
    if (typeof current === "object" && current !== null && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      throw new Error(`Invalid translation path: ${path}`);
    }
  }

  return current as PathValue<T, P>;
}

// ==============================
// Hook
// ==============================

export function useTranslation<P extends NestedKeys<Messages>>(path: P) {
  const { locale } = useParams<{ locale?: LocaleType }>();

  const messages: Messages =
    locale === "ar" ? ar : locale === "fa" ? fa : en;

  return getNestedValue(messages, path);
}

export function useTranslations() {
  const { locale } = useParams<{ locale?: LocaleType }>();

  const messages: Messages =
    locale === "ar" ? ar : locale === "fa" ? fa : en;

  return useCallback(
    <P extends NestedKeys<Messages>>(path: P): PathValue<Messages, P> =>
      getNestedValue(messages, path),
    [messages],
  );
}