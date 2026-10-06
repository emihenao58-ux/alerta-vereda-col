import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { themeFromDocument, type AppTheme } from "@/lib/theme";
import { transitionToTheme } from "@/lib/theme-transition";

export function ThemeToggle() {
  const [theme, setTheme] = useState<AppTheme | null>(null);

  useEffect(() => {
    setTheme(themeFromDocument());
  }, []);

  const seleccionarTema = (nextTheme: AppTheme) => {
    transitionToTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <div className="theme-toggle" role="group" aria-label="Seleccionar modo de color">
      <button
        type="button"
        className={theme === "light" ? "theme-toggle-option is-active" : "theme-toggle-option"}
        aria-label="Modo día"
        aria-pressed={theme === "light"}
        title="Modo día"
        onClick={() => seleccionarTema("light")}
      >
        <Sun size={17} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={theme === "dark" ? "theme-toggle-option is-active" : "theme-toggle-option"}
        aria-label="Modo noche"
        aria-pressed={theme === "dark"}
        title="Modo noche"
        onClick={() => seleccionarTema("dark")}
      >
        <Moon size={17} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  );
}
