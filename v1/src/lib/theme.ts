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
  custom_font_heading: "--font-heading",
  custom_btn_padding_x: "--btn-padding-x",
  custom_btn_padding_y: "--btn-padding-y",
  custom_card_padding: "--card-padding",
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

  // Clés composites : calculées à partir de plusieurs réglages
  // (non mappables directement dans CUSTOMIZATION_MAP)

  // Style de bouton → rayon de bordure
  const btnStyle = settings.custom_btn_style;
  if (btnStyle !== undefined) {
    const btnRadius =
      btnStyle === "pill" ? "9999px" : btnStyle === "square" ? "0" : "var(--radius-sm)";
    root.style.setProperty("--btn-radius", btnRadius);
  }

  // Épaisseur de police des boutons
  const btnFontWeight = settings.custom_btn_font_weight;
  if (btnFontWeight !== undefined) {
    const weight = btnFontWeight === "bold" ? "700" : btnFontWeight === "medium" ? "500" : "400";
    root.style.setProperty("--btn-font-weight", weight);
  }

  // Style de carte → ombre, bordure et rayon (dépend de plusieurs réglages)
  const cardStyle = settings.custom_card_style;
  if (cardStyle !== undefined) {
    const shadowLevel = settings.custom_card_shadow;
    const borderColor = settings.custom_border_color;
    const radiusMd = settings.custom_border_radius_md;
    const radiusLg = settings.custom_border_radius_lg;

    // Ombre portée
    let cardShadow: string;
    if (cardStyle === "neumorphic") {
      cardShadow = "var(--shadow-neumorphic)";
    } else {
      switch (shadowLevel) {
        case "none":
          cardShadow = "none";
          break;
        case "light":
          cardShadow = "0 2px 8px rgba(0,0,0,0.08)";
          break;
        case "medium":
          cardShadow = "0 4px 16px rgba(0,0,0,0.12)";
          break;
        case "strong":
          cardShadow = "0 8px 32px rgba(0,0,0,0.2)";
          break;
        default:
          cardShadow = "none";
      }
    }
    root.style.setProperty("--card-shadow", cardShadow);

    // Bordure (shorthand : 2px pour bordered, none pour neumorphic, 1px sinon)
    const cardBorder =
      cardStyle === "bordered"
        ? `2px solid ${borderColor}`
        : cardStyle === "neumorphic"
          ? "none"
          : `1px solid ${borderColor}`;
    root.style.setProperty("--card-border", cardBorder);

    // Rayon de bordure
    const cardRadius =
      cardStyle === "neumorphic" ? `${radiusLg}px` : cardStyle === "flat" ? "0" : `${radiusMd}px`;
    root.style.setProperty("--card-radius", cardRadius);
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
