export function formatDate(
  locale: string,
  value: string | null | undefined,
): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

// Mask an email for the login challenge step: keep the first character of the
// local part and the full domain, e.g. "u***@domain.com" (spec §6.1).
export function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");

  if (atIndex <= 0) return email;

  return `${email.slice(0, 1)}***${email.slice(atIndex)}`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";

  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
