// ---------------------------------------------------------------------------
// Clés de personnalisation acceptées
// ---------------------------------------------------------------------------
// Liste des clés de personnalisation (catégorie "customize") acceptées par
// l'API admin (validation du PUT /api/admin/customize) et leurs métadonnées.
// Chaque client (admin, storefront) fusionne ces valeurs avec les défauts de
// SON thème local — ce fichier ne contient donc aucun defaultValue.

export interface SettingKeyConfig {
  type: string;
  description: string;
}

export const SETTING_KEYS: Record<string, SettingKeyConfig> = {
  // --- Branding ---
  custom_store_name: {
    type: "string",
    description: "Nom du magasin",
  },
  custom_store_tagline: {
    type: "string",
    description: "Slogan du magasin",
  },
  custom_footer_text: {
    type: "string",
    description: "Texte du pied de page",
  },
  custom_contact_email: {
    type: "string",
    description: "Email de contact",
  },
  custom_contact_phone: {
    type: "string",
    description: "Numéro de téléphone",
  },
  custom_contact_address: {
    type: "string",
    description: "Adresse",
  },

  // --- Hero Banner ---
  custom_hero_image: {
    type: "string",
    description: "URL de l'image de bannière hero",
  },
  custom_hero_title: {
    type: "string",
    description: "Titre de la bannière hero",
  },

  // --- Colors ---
  custom_accent_color: {
    type: "string",
    description: "Couleur d'accentuation (hex)",
  },
  custom_bg_primary: {
    type: "string",
    description: "Couleur de fond principale (hex)",
  },
  custom_bg_secondary: {
    type: "string",
    description: "Couleur de fond secondaire (hex)",
  },
  custom_bg_card: {
    type: "string",
    description: "Couleur de fond des cartes (hex)",
  },
  custom_text_primary: {
    type: "string",
    description: "Couleur du texte principal (hex)",
  },
  custom_text_secondary: {
    type: "string",
    description: "Couleur du texte secondaire (hex)",
  },
  custom_border_color: {
    type: "string",
    description: "Couleur des bordures (hex)",
  },

  // --- Typography ---
  custom_font_primary: {
    type: "string",
    description: "Police de caractères principale",
  },
  custom_font_heading: {
    type: "string",
    description: "Police de caractères pour les titres",
  },
  custom_font_size_base: {
    type: "number",
    description: "Taille de police de base (px)",
  },
  custom_font_size_heading: {
    type: "number",
    description: "Taille de police des titres (px)",
  },

  // --- Layout ---
  custom_border_radius_sm: {
    type: "number",
    description: "Rayon de bordure petit (px)",
  },
  custom_border_radius_md: {
    type: "number",
    description: "Rayon de bordure moyen (px)",
  },
  custom_border_radius_lg: {
    type: "number",
    description: "Rayon de bordure grand (px)",
  },
  custom_border_radius_xl: {
    type: "number",
    description: "Rayon de bordure très grand (px)",
  },
  custom_spacing_unit: {
    type: "number",
    description: "Unité d'espacement (px)",
  },

  // --- Buttons ---
  custom_btn_style: {
    type: "string",
    description: "Style des boutons (rounded | square | pill)",
  },
  custom_btn_padding_x: {
    type: "number",
    description: "Padding horizontal des boutons (px)",
  },
  custom_btn_padding_y: {
    type: "number",
    description: "Padding vertical des boutons (px)",
  },
  custom_btn_font_weight: {
    type: "string",
    description: "Épaisseur de la police des boutons (normal | medium | bold)",
  },

  // --- Cards ---
  custom_card_style: {
    type: "string",
    description: "Style des cartes (neumorphic | flat | bordered | elevated)",
  },
  custom_card_shadow: {
    type: "string",
    description: "Ombre des cartes (none | light | medium | strong)",
  },
  custom_card_padding: {
    type: "number",
    description: "Padding des cartes (px)",
  },
};
