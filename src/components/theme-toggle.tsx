import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { applyTheme, themeFromDocument, type AppTheme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<AppTheme | null>(null);

  useEffect(() => {
    setTheme(themeFromDocument());
  }, []);

  const isDark = theme === "dark";
  const nextTheme: AppTheme = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={
        theme === null ? "Cambiar tema" : isDark ? "Cambiar a modo día" : "Cambiar a modo noche"
      }
      aria-pressed={isDark}
      onClick={() => {
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }}
    >
      {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
      <span>{theme === null ? "Tema" : isDark ? "Modo día" : "Modo noche"}</span>
    </button>
  );
}
