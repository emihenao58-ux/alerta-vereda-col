import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { getThemeTarget, subscribeThemeTarget, transitionToTheme } from "@/lib/theme-transition";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeThemeTarget, getThemeTarget, () => "light");

  return (
    <div className="theme-toggle" role="group" aria-label="Seleccionar modo de color">
      <button
        type="button"
        className={theme === "light" ? "theme-toggle-option is-active" : "theme-toggle-option"}
        aria-label="Modo día"
        aria-pressed={theme === "light"}
        title="Modo día"
        onClick={() => transitionToTheme("light")}
      >
        <Sun size={17} strokeWidth={2.2} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={theme === "dark" ? "theme-toggle-option is-active" : "theme-toggle-option"}
        aria-label="Modo noche"
        aria-pressed={theme === "dark"}
        title="Modo noche"
        onClick={() => transitionToTheme("dark")}
      >
        <Moon size={17} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </div>
  );
}
