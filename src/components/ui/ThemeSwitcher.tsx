"use client";

import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";

const themes = [
  { name: "NEUMORPHISM", label: "Neumorphism", color: "#4F46E5", bg: "#E0E5EC" },
  { name: "LUXURY", label: "Luxury", color: "#D4AF37", bg: "#0B090A" },
  { name: "VIBRANT", label: "Vibrant", color: "#CCFF00", bg: "#0F0F12" },
  { name: "ORGANIC", label: "Organic", color: "#6B8E23", bg: "#F7F5F0" },
  { name: "TECH", label: "Tech", color: "#00E5FF", bg: "#0A0E17" },
] as const;

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-[var(--text-secondary)]">Thème actif</h3>
      <div className="grid grid-cols-5 gap-3">
        {themes.map((t) => (
          <button
            key={t.name}
            onClick={() =>
              setTheme(t.name as "NEUMORPHISM" | "LUXURY" | "VIBRANT" | "ORGANIC" | "TECH")
            }
            className={cn(
              "group relative flex flex-col items-center gap-2 rounded-[var(--radius-md)] border-2 p-3 transition-[var(--transition)]",
              theme === t.name
                ? "border-[var(--accent)] bg-[var(--accent-light)]"
                : "border-[var(--border)] hover:border-[var(--accent)]"
            )}
          >
            <div
              className="h-12 w-full rounded-[var(--radius-sm)]"
              style={{ backgroundColor: t.bg }}
            >
              <div
                className="mx-auto mt-2 h-2 w-8 rounded-full"
                style={{ backgroundColor: t.color }}
              />
            </div>
            <span className="text-xs font-medium text-[var(--text-secondary)]">{t.label}</span>
            {theme === t.name && (
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-xs text-white">
                ✓
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
