export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

export function getStoredTheme(): Theme | null {
  const value = localStorage.getItem(THEME_STORAGE_KEY);

  return value === "light" || value === "dark" ? value : null;
}

export function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

export function getResolvedTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function initTheme(): void {
  applyTheme(getStoredTheme() ?? getSystemTheme());
}
