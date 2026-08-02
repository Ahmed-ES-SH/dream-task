import { MoonIcon, SunIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getResolvedTheme, setTheme, type Theme } from "@/lib/theme";

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(getResolvedTheme);

  const onToggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
