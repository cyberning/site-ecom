/**
 * Données partagées des 5 thèmes du dashboard admin.
 * Source unique de vérité pour les noms, libellés, couleurs et descriptions.
 */

export type ThemeType = "NEUMORPHISM" | "LUXURY" | "VIBRANT" | "ORGANIC" | "TECH";

export interface Theme {
  name: ThemeType;
  label: string;
  color: string;
  bg: string;
  description: string;
}

export const THEMES: Theme[] = [
  {
    name: "NEUMORPHISM",
    label: "Neumorphism",
    color: "#4F46E5",
    bg: "#E0E5EC",
    description: "Interface douce et moderne",
  },
  {
    name: "LUXURY",
    label: "Luxury",
    color: "#D4AF37",
    bg: "#0B090A",
    description: "Élégance sombre et dorée",
  },
  {
    name: "VIBRANT",
    label: "Vibrant",
    color: "#CCFF00",
    bg: "#0F0F12",
    description: "Énergie streetwear néon",
  },
  {
    name: "ORGANIC",
    label: "Organic",
    color: "#6B8E23",
    bg: "#F7F5F0",
    description: "Naturel et artisanal",
  },
  {
    name: "TECH",
    label: "Tech",
    color: "#00E5FF",
    bg: "#0A0E17",
    description: "Futuriste high-tech",
  },
];

export const VALID_THEMES: ThemeType[] = THEMES.map((t) => t.name);
