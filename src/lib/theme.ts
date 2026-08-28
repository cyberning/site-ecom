/**
 * Mapping des clés de personnalisation (custom_*) vers les variables CSS
 * et application de ces valeurs sur le document. Source unique de vérité
 * partagée entre le ThemeProvider et la page de personnalisation.
 */

export const CUSTOMIZATION_MAP: Record<string, string> = {
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

export function applyCustomizationsToDocument(settings: Record<string, string | number>) {
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
