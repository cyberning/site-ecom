import { describe, it, expect } from "vitest";
import {
  BRAND_DEFAULTS,
  THEME_DEFAULTS,
  getThemeDefaults,
  type CustomizationValues,
} from "../themeDefaults";
import { VALID_THEMES, type ThemeType } from "../themes";

// ---------------------------------------------------------------------------
// Constantes de référence du test
// ---------------------------------------------------------------------------

/** Les 8 clés d'identité de marque, communes à tous les thèmes. */
const BRAND_KEYS = [
  "custom_store_name",
  "custom_store_tagline",
  "custom_footer_text",
  "custom_contact_email",
  "custom_contact_phone",
  "custom_contact_address",
  "custom_hero_image",
  "custom_hero_title",
] as const;

/** Les 23 clés de style, propres à chaque thème. */
const STYLE_KEYS = [
  "custom_accent_color",
  "custom_bg_primary",
  "custom_bg_secondary",
  "custom_bg_card",
  "custom_text_primary",
  "custom_text_secondary",
  "custom_border_color",
  "custom_font_primary",
  "custom_font_heading",
  "custom_font_size_base",
  "custom_font_size_heading",
  "custom_border_radius_sm",
  "custom_border_radius_md",
  "custom_border_radius_lg",
  "custom_border_radius_xl",
  "custom_spacing_unit",
  "custom_btn_style",
  "custom_btn_padding_x",
  "custom_btn_padding_y",
  "custom_btn_font_weight",
  "custom_card_style",
  "custom_card_shadow",
  "custom_card_padding",
] as const;

/** Les 31 clés attendues pour chaque thème (8 brand + 23 style). */
const ALL_KEYS = [...BRAND_KEYS, ...STYLE_KEYS];

/** Les clés de couleur (format hex attendu : #RRGGBB). */
const HEX_COLOR_KEYS = [
  "custom_accent_color",
  "custom_bg_primary",
  "custom_bg_secondary",
  "custom_bg_card",
  "custom_text_primary",
  "custom_text_secondary",
  "custom_border_color",
] as const;

/** Les clés de rayon de bordure (plage slider : 0 à 32). */
const RADIUS_KEYS = [
  "custom_border_radius_sm",
  "custom_border_radius_md",
  "custom_border_radius_lg",
  "custom_border_radius_xl",
] as const;

/** Les valeurs autorisées pour les clés de type énumération. */
const BTN_STYLES = ["rounded", "square", "pill"] as const;
const BTN_FONT_WEIGHTS = ["normal", "medium", "bold"] as const;
const CARD_STYLES = ["neumorphic", "flat", "bordered", "elevated"] as const;
const CARD_SHADOWS = ["none", "light", "medium", "strong"] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Vérifie qu'une valeur est un nombre compris dans [min, max]. */
function expectNumberInRange(value: string | number, min: number, max: number) {
  expect(typeof value).toBe("number");
  expect(value as number).toBeGreaterThanOrEqual(min);
  expect(value as number).toBeLessThanOrEqual(max);
}

/** Vérifie qu'une valeur est une couleur hex valide (#RRGGBB). */
function expectHexColor(value: string | number) {
  expect(typeof value).toBe("string");
  expect(value).toMatch(/^#[0-9A-Fa-f]{6}$/);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("THEME_DEFAULTS", () => {
  it("contient exactement les 5 thèmes de VALID_THEMES", () => {
    expect(Object.keys(THEME_DEFAULTS).sort()).toEqual([...VALID_THEMES].sort());
  });

  it("contient les 31 clés attendues (8 brand + 23 style) pour chaque thème", () => {
    for (const theme of VALID_THEMES) {
      expect(Object.keys(THEME_DEFAULTS[theme]).sort()).toEqual([...ALL_KEYS].sort());
    }
  });

  it("partage les mêmes valeurs de marque dans tous les thèmes", () => {
    for (const theme of VALID_THEMES) {
      for (const key of BRAND_KEYS) {
        expect(THEME_DEFAULTS[theme][key]).toBe(BRAND_DEFAULTS[key]);
      }
    }
  });

  it("reflète BRAND_DEFAULTS pour les 8 clés de marque", () => {
    for (const key of BRAND_KEYS) {
      expect(BRAND_DEFAULTS[key]).toBeDefined();
    }
  });
});

describe("THEME_DEFAULTS.NEUMORPHISM (anciens défauts historiques)", () => {
  const neumorphism = THEME_DEFAULTS.NEUMORPHISM;

  it("conserve les couleurs historiques", () => {
    expect(neumorphism.custom_accent_color).toBe("#4F46E5");
    expect(neumorphism.custom_bg_primary).toBe("#E0E5EC");
    expect(neumorphism.custom_bg_secondary).toBe("#D1D9E6");
    expect(neumorphism.custom_bg_card).toBe("#E0E5EC");
    expect(neumorphism.custom_text_primary).toBe("#2D3748");
    expect(neumorphism.custom_text_secondary).toBe("#4A5568");
    expect(neumorphism.custom_border_color).toBe("#CBD5E0");
  });

  it("conserve les rayons de bordure historiques (8/12/16/24)", () => {
    expect(neumorphism.custom_border_radius_sm).toBe(8);
    expect(neumorphism.custom_border_radius_md).toBe(12);
    expect(neumorphism.custom_border_radius_lg).toBe(16);
    expect(neumorphism.custom_border_radius_xl).toBe(24);
  });

  it("conserve la police Inter et les tailles de police historiques", () => {
    expect(neumorphism.custom_font_primary).toBe("Inter, sans-serif");
    expect(neumorphism.custom_font_heading).toBe("Inter, sans-serif");
    expect(neumorphism.custom_font_size_base).toBe(16);
    expect(neumorphism.custom_font_size_heading).toBe(24);
  });

  it("conserve le style de bouton historique (rounded/16/8/medium)", () => {
    expect(neumorphism.custom_btn_style).toBe("rounded");
    expect(neumorphism.custom_btn_padding_x).toBe(16);
    expect(neumorphism.custom_btn_padding_y).toBe(8);
    expect(neumorphism.custom_btn_font_weight).toBe("medium");
  });

  it("conserve le style de carte historique (neumorphic/medium/24)", () => {
    expect(neumorphism.custom_card_style).toBe("neumorphic");
    expect(neumorphism.custom_card_shadow).toBe("medium");
    expect(neumorphism.custom_card_padding).toBe(24);
  });

  it("conserve le spacing unitaire historique (4)", () => {
    expect(neumorphism.custom_spacing_unit).toBe(4);
  });
});

describe("Valeurs dans les plages des sliders (pour chaque thème)", () => {
  it("garde custom_font_size_base entre 12 et 24", () => {
    for (const theme of VALID_THEMES) {
      expectNumberInRange(THEME_DEFAULTS[theme].custom_font_size_base, 12, 24);
    }
  });

  it("garde custom_font_size_heading entre 18 et 48", () => {
    for (const theme of VALID_THEMES) {
      expectNumberInRange(THEME_DEFAULTS[theme].custom_font_size_heading, 18, 48);
    }
  });

  it("garde les rayons de bordure entre 0 et 32", () => {
    for (const theme of VALID_THEMES) {
      for (const key of RADIUS_KEYS) {
        expectNumberInRange(THEME_DEFAULTS[theme][key], 0, 32);
      }
    }
  });

  it("garde custom_spacing_unit entre 2 et 8", () => {
    for (const theme of VALID_THEMES) {
      expectNumberInRange(THEME_DEFAULTS[theme].custom_spacing_unit, 2, 8);
    }
  });

  it("garde custom_btn_padding_x entre 4 et 48", () => {
    for (const theme of VALID_THEMES) {
      expectNumberInRange(THEME_DEFAULTS[theme].custom_btn_padding_x, 4, 48);
    }
  });

  it("garde custom_btn_padding_y entre 2 et 24", () => {
    for (const theme of VALID_THEMES) {
      expectNumberInRange(THEME_DEFAULTS[theme].custom_btn_padding_y, 2, 24);
    }
  });

  it("garde custom_card_padding entre 8 et 48", () => {
    for (const theme of VALID_THEMES) {
      expectNumberInRange(THEME_DEFAULTS[theme].custom_card_padding, 8, 48);
    }
  });

  it("limite custom_btn_style à {rounded, square, pill}", () => {
    for (const theme of VALID_THEMES) {
      expect(BTN_STYLES).toContain(THEME_DEFAULTS[theme].custom_btn_style);
    }
  });

  it("limite custom_btn_font_weight à {normal, medium, bold}", () => {
    for (const theme of VALID_THEMES) {
      expect(BTN_FONT_WEIGHTS).toContain(THEME_DEFAULTS[theme].custom_btn_font_weight);
    }
  });

  it("limite custom_card_style à {neumorphic, flat, bordered, elevated}", () => {
    for (const theme of VALID_THEMES) {
      expect(CARD_STYLES).toContain(THEME_DEFAULTS[theme].custom_card_style);
    }
  });

  it("limite custom_card_shadow à {none, light, medium, strong}", () => {
    for (const theme of VALID_THEMES) {
      expect(CARD_SHADOWS).toContain(THEME_DEFAULTS[theme].custom_card_shadow);
    }
  });

  it("formate les couleurs en hex (#RRGGBB, 7 caractères)", () => {
    for (const theme of VALID_THEMES) {
      for (const key of HEX_COLOR_KEYS) {
        expectHexColor(THEME_DEFAULTS[theme][key]);
      }
    }
  });
});

describe("getThemeDefaults", () => {
  it("retourne les défauts du thème demandé", () => {
    for (const theme of VALID_THEMES) {
      expect(getThemeDefaults(theme)).toBe(THEME_DEFAULTS[theme]);
    }
  });

  it("retourne un objet complet de 31 clés pour un thème valide", () => {
    const defaults = getThemeDefaults("NEUMORPHISM") as CustomizationValues;
    expect(Object.keys(defaults).sort()).toEqual([...ALL_KEYS].sort());
  });

  it("retourne NEUMORPHISM pour un thème inconnu", () => {
    const unknown = getThemeDefaults("INCONNU" as ThemeType);
    expect(unknown).toBe(THEME_DEFAULTS.NEUMORPHISM);
    expect(unknown).toEqual(THEME_DEFAULTS.NEUMORPHISM);
  });

  it("retourne un objet complet de 31 clés pour un thème inconnu", () => {
    const unknown = getThemeDefaults("INCONNU" as ThemeType) as CustomizationValues;
    expect(Object.keys(unknown).sort()).toEqual([...ALL_KEYS].sort());
  });
});
