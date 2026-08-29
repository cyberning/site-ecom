"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "@/hooks/useSession";
import { type ThemeType, VALID_THEMES } from "@/lib/themes";
import { applyCustomizationsToDocument } from "@/lib/theme";
import { getThemeDefaults, BRAND_DEFAULTS } from "@/lib/themeDefaults";

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

  // Garde anti-course : seul le fetch le plus récent peut appliquer ses valeurs
  const fetchSeqRef = useRef(0);

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
  const fetchCustomizations = useCallback(
    async (themeOverride?: ThemeType) => {
      const seq = ++fetchSeqRef.current;
      // Le thème effectif peut être fourni explicitement (changement de thème en
      // cours) pour éviter d'utiliser une closure obsolète pendant setTheme.
      const effectiveTheme = themeOverride ?? theme;
      try {
        const res = await fetch("/api/admin/customize");
        if (!res.ok) return;
        const data: Array<{ key: string; value: string | number }> = await res.json();
        // M3 : l'API renvoie désormais les valeurs DB brutes (sans fusion).
        // On fusionne ici par-dessus les défauts du thème local pour garantir
        // que toutes les variables CSS sont posées, même sans valeur en DB.
        const rawValues: Record<string, string | number> = {};
        for (const item of data) {
          rawValues[item.key] = item.value;
        }
        const settingsMap: Record<string, string | number> = {
          ...getThemeDefaults(effectiveTheme),
          ...rawValues,
        };
        // M2 : si un fetch plus récent a démarré entre-temps, ignorer cette réponse
        if (seq !== fetchSeqRef.current) return;
        applyCustomizationsToDocument(settingsMap);
      } catch {
        // Silent fail — customization is non-blocking
      }
    },
    [theme]
  );

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

      // Appliquer les défauts du nouveau thème au document (même sans valeurs DB)
      applyCustomizationsToDocument(getThemeDefaults(newTheme));

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

          // Réinitialiser les valeurs de personnalisation aux défauts du nouveau thème
          // (Option A : le changement de thème réinitialise tout).
          // NB : on exclut l'identité de marque (BRAND_DEFAULTS) qui est indépendante
          // du thème — la réinitialiser effacerait le nom du magasin, les contacts, etc.
          const styleDefaults = Object.fromEntries(
            Object.entries(getThemeDefaults(newTheme)).filter(([key]) => !(key in BRAND_DEFAULTS))
          );
          const payload = Object.entries(styleDefaults).map(([key, value]) => ({ key, value }));
          await fetch("/api/admin/customize", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ settings: payload }),
          });
        } catch (error) {
          console.error("Erreur sauvegarde thème:", error);
        }
      }

      // Ré-appliquer les éventuelles valeurs customisées en DB par-dessus les défauts.
      // On passe newTheme explicitement : la closure de fetchCustomizations contient
      // encore l'ancien thème (setThemeState est asynchrone), ce qui provoquerait
      // une fusion avec les mauvais défauts.
      await fetchCustomizations(newTheme);
    },
    [isAuthenticated, fetchCustomizations]
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, refreshCustomizations }}>
      {children}
    </ThemeContext.Provider>
  );
}
