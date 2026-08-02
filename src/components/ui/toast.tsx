import { useEffect, useState } from "react";
import { Toaster as SonnerToaster, toast } from "sonner";

import { getResolvedTheme, type Theme } from "@/lib/theme";

function useAppTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(getResolvedTheme);

  useEffect(() => {
    const updateTheme = () => setTheme(getResolvedTheme());
    const observer = new MutationObserver(updateTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}

function Toaster() {
  const theme = useAppTheme();

  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      richColors
    />
  );
}

export { Toaster, toast };
