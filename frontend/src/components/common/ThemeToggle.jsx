import React from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      className="header-action-button theme-toggle"
      onClick={onToggle}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      type="button"
    >
      <Icon size={16} />
    </button>
  );
}
