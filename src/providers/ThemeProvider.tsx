"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { type ThemeType, VALID_THEMES } from "@/lib/themes";
import { applyCustomizationsToDocument } from "@/lib/theme";

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

export default function ThemeProvider({
  children,
  initialTheme = "NEUMORPHISM",
}: {
  children: React.ReactNode;
  initialTheme?: ThemeType;
}) {
  // Le thème initial provient de la DB (fallback) ; le cookie reste prioritaire au montage
  const [theme, setThemeState] = useState<ThemeType>(initialTheme);
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
