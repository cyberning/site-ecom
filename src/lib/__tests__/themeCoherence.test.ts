import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { THEME_DEFAULTS } from "../themeDefaults";
import { SETTING_KEYS } from "../customizationKeys";
import { VALID_THEMES, type ThemeType } from "../themes";

// ---------------------------------------------------------------------------
// Tests de cohérence entre les sources de vérité de la feature
// « valeurs par défaut par thème ».
//
// Ces tests protègent contre une dérive future : si une clé est ajoutée à
// SETTING_KEYS sans être dans THEME_DEFAULTS, le GET renvoie `value: undefined`
// (bug UI) ; si une valeur CSS change dans themes.css sans être mise à jour
// dans themeDefaults.ts, le storefront et l'admin divergent.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// A. Cohérence SETTING_KEYS ↔ THEME_DEFAULTS
// ---------------------------------------------------------------------------

describe("Cohérence SETTING_KEYS ↔ THEME_DEFAULTS", () => {
  it("contient exactement les mêmes clés que THEME_DEFAULTS.NEUMORPHISM (31 clés)", () => {
    const settingKeys = Object.keys(SETTING_KEYS).sort();
    const defaultKeys = Object.keys(THEME_DEFAULTS.NEUMORPHISM).sort();

    expect(settingKeys).toEqual(defaultKeys);
    expect(settingKeys).toHaveLength(31);
  });

  it("chaque clé de SETTING_KEYS existe dans THEME_DEFAULTS de CHAQUE thème", () => {
    for (const theme of VALID_THEMES) {
      const defaultKeys = Object.keys(THEME_DEFAULTS[theme]);
      for (const key of Object.keys(SETTING_KEYS)) {
        expect(defaultKeys).toContain(key);
      }
    }
  });

  it("chaque clé de THEME_DEFAULTS[theme] (pour chaque thème) existe dans SETTING_KEYS", () => {
    const settingKeys = Object.keys(SETTING_KEYS);
    for (const theme of VALID_THEMES) {
      for (const key of Object.keys(THEME_DEFAULTS[theme])) {
        expect(settingKeys).toContain(key);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// B. Alignement themes.css ↔ THEME_DEFAULTS
// ---------------------------------------------------------------------------

// Lecture du fichier CSS une seule fois pour tout le bloc de tests.
const CSS_PATH = path.join(process.cwd(), "src/styles/themes.css");
const cssContent = fs.readFileSync(CSS_PATH, "utf-8");

/**
 * Extrait le bloc `[data-theme="X"] { ... }` du CSS pour un thème donné.
 * Retourne `null` si le bloc est introuvable.
 */
function extractThemeBlock(theme: string): string | null {
  const match = cssContent.match(new RegExp(`\\[data-theme="${theme}"\\]\\s*\\{([\\s\\S]*?)\\}`));
  return match ? match[1] : null;
}

/**
 * Extrait les paires `--var: value;` d'un bloc CSS sous forme d'objet
 * `{ "--var": "value" }` (valeur sans le point-virgule final, trimée).
 */
function extractCssVariables(block: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const regex = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(block)) !== null) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
}

// --- Normalisations ---------------------------------------------------------
// Les valeurs CSS et les défauts ne partagent pas le même format. On normalise
// les deux côtés avant comparaison. Chaque normalisation est documentée car
// elle est potentiellement fragile (dépend du format exact des valeurs).

/** Normalise une couleur hex : minuscules + suppression des espaces. */
function normalizeColor(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

/** Normalise une valeur en px : `8px` → `8`. */
function normalizePx(value: string): string {
  return value.replace(/\s+/g, "").replace(/px$/i, "");
}

/** Normalise une police : retire les guillemets autour des noms. */
function normalizeFont(value: string): string {
  return value.replace(/"/g, "").trim();
}

/** Normalise un poids de police CSS (400/500/700) vers le libellé du défaut. */
function normalizeFontWeight(value: string): string {
  const map: Record<string, string> = {
    "400": "normal",
    "500": "medium",
    "700": "bold",
  };
  return map[value] ?? value;
}

/**
 * Normalise une valeur de défaut (string | number) en chaîne comparable.
 * Les nombres sont convertis en chaîne (ex. 8 → "8").
 */
function normalizeDefault(value: string | number): string {
  return String(value);
}

/**
 * Vérifie qu'une variable CSS d'un thème correspond à la valeur par défaut
 * attendue, après normalisation. Produit un message d'erreur explicite.
 */
function expectCssMatchesDefault(
  theme: ThemeType,
  cssVar: string,
  cssValue: string,
  defaultKey: string,
  normalize: (v: string) => string
) {
  // On normalise les DEUX côtés : la valeur CSS et la valeur par défaut
  // (ex. le défaut stocke "#4F46E5" en majuscules, le CSS "#4f46e5").
  const expected = normalize(normalizeDefault(THEME_DEFAULTS[theme][defaultKey]));
  const actual = normalize(cssValue);
  expect(actual, `[${theme}] ${cssVar} (CSS) doit correspondre à ${defaultKey} (défauts)`).toBe(
    expected
  );
}

describe("Alignement themes.css ↔ THEME_DEFAULTS", () => {
  // Vérifie que le fichier CSS contient bien un bloc pour chaque thème.
  it("contient un bloc [data-theme=...] pour chacun des 5 thèmes", () => {
    for (const theme of VALID_THEMES) {
      expect(extractThemeBlock(theme), `Bloc CSS manquant pour ${theme}`).not.toBeNull();
    }
  });

  describe("couleurs (hex)", () => {
    const colorMap: Array<[string, string]> = [
      ["--accent", "custom_accent_color"],
      ["--bg-primary", "custom_bg_primary"],
      ["--bg-secondary", "custom_bg_secondary"],
      ["--bg-card", "custom_bg_card"],
      ["--text-primary", "custom_text_primary"],
      ["--text-secondary", "custom_text_secondary"],
      ["--border", "custom_border_color"],
    ];

    it("les couleurs CSS correspondent aux défauts pour chaque thème", () => {
      for (const theme of VALID_THEMES) {
        const block = extractThemeBlock(theme)!;
        const vars = extractCssVariables(block);
        for (const [cssVar, defaultKey] of colorMap) {
          expectCssMatchesDefault(theme, cssVar, vars[cssVar], defaultKey, normalizeColor);
        }
      }
    });
  });

  describe("rayons de bordure (px)", () => {
    const radiusMap: Array<[string, string]> = [
      ["--radius-sm", "custom_border_radius_sm"],
      ["--radius-md", "custom_border_radius_md"],
      ["--radius-lg", "custom_border_radius_lg"],
      ["--radius-xl", "custom_border_radius_xl"],
    ];

    it("les rayons CSS correspondent aux défauts pour chaque thème", () => {
      for (const theme of VALID_THEMES) {
        const block = extractThemeBlock(theme)!;
        const vars = extractCssVariables(block);
        for (const [cssVar, defaultKey] of radiusMap) {
          expectCssMatchesDefault(theme, cssVar, vars[cssVar], defaultKey, normalizePx);
        }
      }
    });
  });

  describe("polices (guillemets retirés)", () => {
    const fontMap: Array<[string, string]> = [
      ["--font-primary", "custom_font_primary"],
      ["--font-heading", "custom_font_heading"],
    ];

    it("les polices CSS correspondent aux défauts pour chaque thème", () => {
      for (const theme of VALID_THEMES) {
        const block = extractThemeBlock(theme)!;
        const vars = extractCssVariables(block);
        for (const [cssVar, defaultKey] of fontMap) {
          expectCssMatchesDefault(theme, cssVar, vars[cssVar], defaultKey, normalizeFont);
        }
      }
    });
  });

  describe("boutons (padding, poids)", () => {
    const paddingMap: Array<[string, string]> = [
      ["--btn-padding-x", "custom_btn_padding_x"],
      ["--btn-padding-y", "custom_btn_padding_y"],
    ];

    it("les paddings de bouton CSS correspondent aux défauts pour chaque thème", () => {
      for (const theme of VALID_THEMES) {
        const block = extractThemeBlock(theme)!;
        const vars = extractCssVariables(block);
        for (const [cssVar, defaultKey] of paddingMap) {
          expectCssMatchesDefault(theme, cssVar, vars[cssVar], defaultKey, normalizePx);
        }
      }
    });

    it("le poids de police des boutons CSS correspond au défaut (400/500/700 → normal/medium/bold)", () => {
      for (const theme of VALID_THEMES) {
        const block = extractThemeBlock(theme)!;
        const vars = extractCssVariables(block);
        expectCssMatchesDefault(
          theme,
          "--btn-font-weight",
          vars["--btn-font-weight"],
          "custom_btn_font_weight",
          normalizeFontWeight
        );
      }
    });
  });

  describe("cartes et espacement (px)", () => {
    const map: Array<[string, string]> = [
      ["--card-padding", "custom_card_padding"],
      ["--spacing-unit", "custom_spacing_unit"],
    ];

    it("le padding de carte et l'unité d'espacement CSS correspondent aux défauts", () => {
      for (const theme of VALID_THEMES) {
        const block = extractThemeBlock(theme)!;
        const vars = extractCssVariables(block);
        for (const [cssVar, defaultKey] of map) {
          expectCssMatchesDefault(theme, cssVar, vars[cssVar], defaultKey, normalizePx);
        }
      }
    });
  });

  // --- Assertions ciblées pour les variables composites ---------------------
  // Ces variables CSS référencent d'autres variables (var(--radius-sm)) ou des
  // valeurs calculées. On fait des assertions ciblées et lisibles plutôt qu'une
  // comparaison générique fragile.

  describe("--btn-radius ↔ custom_btn_style (assertions ciblées)", () => {
    // Le rayon du bouton est dérivé du style : rounded → radius-sm,
    // square → 0, pill → 9999px.
    const expectedBtnRadius: Record<ThemeType, string> = {
      NEUMORPHISM: "var(--radius-sm)",
      LUXURY: "0",
      VIBRANT: "0",
      ORGANIC: "9999px",
      TECH: "var(--radius-sm)",
    };
    const expectedBtnStyle: Record<ThemeType, string> = {
      NEUMORPHISM: "rounded",
      LUXURY: "square",
      VIBRANT: "square",
      ORGANIC: "pill",
      TECH: "rounded",
    };

    it("le rayon du bouton CSS est cohérent avec le style de bouton du défaut", () => {
      for (const theme of VALID_THEMES) {
        const block = extractThemeBlock(theme)!;
        const vars = extractCssVariables(block);
        const cssRadius = vars["--btn-radius"];
        const defaultStyle = String(THEME_DEFAULTS[theme].custom_btn_style);

        expect(
          cssRadius,
          `[${theme}] --btn-radius (${cssRadius}) doit correspondre au style de bouton ${defaultStyle}`
        ).toBe(expectedBtnRadius[theme]);
        expect(defaultStyle).toBe(expectedBtnStyle[theme]);
      }
    });
  });

  describe("--card-shadow ↔ custom_card_shadow (assertions ciblées)", () => {
    // L'ombre de carte est dérivée du niveau d'ombre : medium → ombre
    // neumorphique, light → ombre douce, strong → ombre marquée.
    const expectedCardShadow: Record<ThemeType, string> = {
      NEUMORPHISM: "var(--shadow-neumorphic)",
      LUXURY: "0 2px 8px rgba(0, 0, 0, 0.08)",
      VIBRANT: "0 8px 32px rgba(0, 0, 0, 0.2)",
      ORGANIC: "var(--shadow-neumorphic)",
      TECH: "0 2px 8px rgba(0, 0, 0, 0.08)",
    };
    const expectedCardShadowLevel: Record<ThemeType, string> = {
      NEUMORPHISM: "medium",
      LUXURY: "light",
      VIBRANT: "strong",
      ORGANIC: "light",
      TECH: "light",
    };

    it("l'ombre de carte CSS est cohérente avec le niveau d'ombre du défaut", () => {
      for (const theme of VALID_THEMES) {
        const block = extractThemeBlock(theme)!;
        const vars = extractCssVariables(block);
        const cssShadow = vars["--card-shadow"];
        const defaultShadow = String(THEME_DEFAULTS[theme].custom_card_shadow);

        expect(
          cssShadow,
          `[${theme}] --card-shadow (${cssShadow}) doit correspondre au niveau d'ombre ${defaultShadow}`
        ).toBe(expectedCardShadow[theme]);
        expect(defaultShadow).toBe(expectedCardShadowLevel[theme]);
      }
    });
  });

  describe("--card-radius et --card-border (assertions ciblées)", () => {
    // Le rayon de carte est dérivé du style de carte ; la bordure dépend du
    // style (bordered → bordure visible, sinon none).
    const expectedCardRadius: Record<ThemeType, string> = {
      NEUMORPHISM: "var(--radius-lg)",
      LUXURY: "var(--radius-md)",
      VIBRANT: "var(--radius-md)",
      ORGANIC: "var(--radius-lg)",
      TECH: "var(--radius-md)",
    };
    const expectedCardBorder: Record<ThemeType, string> = {
      NEUMORPHISM: "none",
      LUXURY: "2px solid #333030",
      VIBRANT: "1px solid #2e2e36",
      ORGANIC: "none",
      TECH: "1px solid #1e293b",
    };

    it("le rayon de carte CSS est cohérent avec le style de carte du défaut", () => {
      for (const theme of VALID_THEMES) {
        const block = extractThemeBlock(theme)!;
        const vars = extractCssVariables(block);
        expect(
          vars["--card-radius"],
          `[${theme}] --card-radius doit correspondre au style de carte ${THEME_DEFAULTS[theme].custom_card_style}`
        ).toBe(expectedCardRadius[theme]);
      }
    });

    it("la bordure de carte CSS est cohérente avec le style de carte du défaut", () => {
      for (const theme of VALID_THEMES) {
        const block = extractThemeBlock(theme)!;
        const vars = extractCssVariables(block);
        expect(
          vars["--card-border"],
          `[${theme}] --card-border doit correspondre au style de carte ${THEME_DEFAULTS[theme].custom_card_style}`
        ).toBe(expectedCardBorder[theme]);
      }
    });
  });
});
