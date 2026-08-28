"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useSession } from "@/hooks/useSession";

type ThemeType = "NEUMORPHISM" | "LUXURY" | "VIBRANT" | "ORGANIC" | "TECH";

const VALID_THEMES: ThemeType[] = ["NEUMORPHISM", "LUXURY", "VIBRANT", "ORGANIC", "TECH"];

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  refreshCustomizations: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "NEUMORPHISM",
  setTheme: () => {},
  refreshCustomizations: async () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

// Map custom_* keys to CSS variables / body style
const CUSTOMIZATION_MAP: Record<string, string> = {
  custom_accent_color: "--accent",
  custom_bg_primary: "--bg-primary",
  custom_bg_secondary: "--bg-secondary",
  custom_bg_card: "--bg-card",
  custom_text_primary: "--text-primary",
  custom_text_secondary: "--text-secondary",
  custom_border_color: "--border",
  custom_border_radius_sm: "--radius-sm",
  custom_border_radius_md: "--radius-md",
  custom_border_radius_lg: "--radius-lg",
  custom_border_radius_xl: "--radius-xl",
  custom_spacing_unit: "--spacing-unit",
};

function applyCustomizationsToDocument(settings: Record<string, string | number>) {
  const root = document.documentElement;

  for (const [key, cssVar] of Object.entries(CUSTOMIZATION_MAP)) {
    const val = settings[key];
    if (val !== undefined && val !== "") {
      const cssValue = typeof val === "number" ? `${val}px` : String(val);
      root.style.setProperty(cssVar, cssValue);
    }
  }

  // Font → body
  const fontPrimary = settings.custom_font_primary;
  if (fontPrimary) {
    document.body.style.fontFamily = String(fontPrimary);
  }

  // Font size → body
  const fontSizeBase = settings.custom_font_size_base;
  if (fontSizeBase !== undefined) {
    document.body.style.fontSize = `${fontSizeBase}px`;
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>("NEUMORPHISM");
  const { isAuthenticated } = useSession();

  // Lire le thème depuis le cookie au montage (côté client uniquement)
  useEffect(() => {
    try {
      const cookieTheme = document.cookie
        .split(";")
        .find((c) => c.trim().startsWith("theme="))
        ?.split("=")[1] as ThemeType | undefined;

      if (cookieTheme && VALID_THEMES.includes(cookieTheme)) {
        setThemeState(cookieTheme);
        document.documentElement.setAttribute("data-theme", cookieTheme);
      }
    } catch {
      // SSR safety: document.cookie non disponible
    }
  }, []);

  // Fetch and apply customizations from API on mount
  const fetchCustomizations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/customize");
      if (!res.ok) return;
      const data: Array<{ key: string; value: string | number }> = await res.json();
      const settingsMap: Record<string, string | number> = {};
      for (const item of data) {
        settingsMap[item.key] = item.value;
      }
      applyCustomizationsToDocument(settingsMap);
    } catch {
      // Silent fail — customization is non-blocking
    }
  }, []);

  useEffect(() => {
    fetchCustomizations();
  }, [fetchCustomizations]);

  const refreshCustomizations = useCallback(async () => {
    await fetchCustomizations();
  }, [fetchCustomizations]);

  const setTheme = useCallback(
    async (newTheme: ThemeType) => {
      setThemeState(newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
      document.cookie = `theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;

      // Sauvegarder en DB si admin connecté
      if (isAuthenticated) {
        try {
          await fetch("/api/admin/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: "active_theme",
              value: newTheme,
              type: "string",
              category: "theme",
            }),
          });
        } catch (error) {
          console.error("Erreur sauvegarde thème:", error);
        }
      }
    },
    [isAuthenticated]
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, refreshCustomizations }}>
      {children}
    </ThemeContext.Provider>
  );
}
