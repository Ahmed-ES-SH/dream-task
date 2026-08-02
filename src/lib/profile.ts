import type { StringKey, Translator } from "@/types/profile";

export function labelFor(
  t: Translator,
  value: string,
  keys: Record<string, StringKey>,
): string {
  const key = keys[value.toLowerCase()];

  if (!key) {
    return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "—";
  }

  return t(key);
}
