import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateStoreSettingsCache } from "@/lib/getStoreSettings";

// ---------------------------------------------------------------------------
// Configuration des clés de personnalisation
// ---------------------------------------------------------------------------

interface SettingKeyConfig {
  defaultValue: string | number;
  type: string;
  description: string;
}

const SETTING_KEYS: Record<string, SettingKeyConfig> = {
  // --- Branding ---
  custom_store_name: {
    defaultValue: "Nom du magasin",
    type: "string",
    description: "Nom du magasin",
  },
  custom_store_tagline: {
    defaultValue: "Slogan du magasin",
    type: "string",
    description: "Slogan du magasin",
  },
  custom_footer_text: {
    defaultValue: "Texte du pied de page",
    type: "string",
    description: "Texte du pied de page",
  },
  custom_contact_email: {
    defaultValue: "Email de contact",
    type: "string",
    description: "Email de contact",
  },
  custom_contact_phone: {
    defaultValue: "Numéro de téléphone",
    type: "string",
    description: "Numéro de téléphone",
  },
  custom_contact_address: {
    defaultValue: "Adresse",
    type: "string",
    description: "Adresse",
  },

  // --- Hero Banner ---
  custom_hero_image: {
    defaultValue: "",
    type: "string",
    description: "URL de l'image de bannière hero",
  },
  custom_hero_title: {
    defaultValue: "Les meilleurs produits au meilleur prix",
    type: "string",
    description: "Titre de la bannière hero",
  },

  // --- Colors ---
  custom_accent_color: {
    defaultValue: "#4F46E5",
    type: "string",
    description: "Couleur d'accentuation (hex)",
  },
  custom_bg_primary: {
    defaultValue: "#E0E5EC",
    type: "string",
    description: "Couleur de fond principale (hex)",
  },
  custom_bg_secondary: {
    defaultValue: "#D1D9E6",
    type: "string",
    description: "Couleur de fond secondaire (hex)",
  },
  custom_bg_card: {
    defaultValue: "#E0E5EC",
    type: "string",
    description: "Couleur de fond des cartes (hex)",
  },
  custom_text_primary: {
    defaultValue: "#2D3748",
    type: "string",
    description: "Couleur du texte principal (hex)",
  },
  custom_text_secondary: {
    defaultValue: "#4A5568",
    type: "string",
    description: "Couleur du texte secondaire (hex)",
  },
  custom_border_color: {
    defaultValue: "#CBD5E0",
    type: "string",
    description: "Couleur des bordures (hex)",
  },

  // --- Typography ---
  custom_font_primary: {
    defaultValue: "Inter, sans-serif",
    type: "string",
    description: "Police de caractères principale",
  },
  custom_font_heading: {
    defaultValue: "Inter, sans-serif",
    type: "string",
    description: "Police de caractères pour les titres",
  },
  custom_font_size_base: {
    defaultValue: 16,
    type: "number",
    description: "Taille de police de base (px)",
  },
  custom_font_size_heading: {
    defaultValue: 24,
    type: "number",
    description: "Taille de police des titres (px)",
  },

  // --- Layout ---
  custom_border_radius_sm: {
    defaultValue: 8,
    type: "number",
    description: "Rayon de bordure petit (px)",
  },
  custom_border_radius_md: {
    defaultValue: 12,
    type: "number",
    description: "Rayon de bordure moyen (px)",
  },
  custom_border_radius_lg: {
    defaultValue: 16,
    type: "number",
    description: "Rayon de bordure grand (px)",
  },
  custom_border_radius_xl: {
    defaultValue: 24,
    type: "number",
    description: "Rayon de bordure très grand (px)",
  },
  custom_spacing_unit: {
    defaultValue: 4,
    type: "number",
    description: "Unité d'espacement (px)",
  },

  // --- Buttons ---
  custom_btn_style: {
    defaultValue: "rounded",
    type: "string",
    description: "Style des boutons (rounded | square | pill)",
  },
  custom_btn_padding_x: {
    defaultValue: 16,
    type: "number",
    description: "Padding horizontal des boutons (px)",
  },
  custom_btn_padding_y: {
    defaultValue: 8,
    type: "number",
    description: "Padding vertical des boutons (px)",
  },
  custom_btn_font_weight: {
    defaultValue: "medium",
    type: "string",
    description: "Épaisseur de la police des boutons (normal | medium | bold)",
  },

  // --- Cards ---
  custom_card_style: {
    defaultValue: "neumorphic",
    type: "string",
    description: "Style des cartes (neumorphic | flat | bordered | elevated)",
  },
  custom_card_shadow: {
    defaultValue: "medium",
    type: "string",
    description: "Ombre des cartes (none | light | medium | strong)",
  },
  custom_card_padding: {
    defaultValue: 24,
    type: "number",
    description: "Padding des cartes (px)",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAdmin(session: unknown): boolean {
  const s = session as { user?: { role?: string } } | null;
  return !!s?.user && s.user.role === "ADMIN";
}

// ---------------------------------------------------------------------------
// GET /api/admin/customize
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const session = await auth();
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const settings = await prisma.setting.findMany({
      where: { category: "customize" },
      orderBy: { key: "asc" },
    });

    // Merge DB values with defaults so the frontend always gets a full set
    const merged = Object.entries(SETTING_KEYS).map(([key, config]) => {
      const dbSetting = settings.find((s) => s.key === key);
      return {
        key,
        value: dbSetting?.value ?? config.defaultValue,
        type: config.type,
        category: "customize",
        description: config.description,
      };
    });

    return NextResponse.json(merged);
  } catch (error) {
    console.error("Erreur GET /api/admin/customize:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/admin/customize
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body as {
      settings?: Array<{ key: string; value: string | number | boolean }>;
    };

    if (!Array.isArray(settings) || settings.length === 0) {
      return NextResponse.json({ error: "Tableau de paramètres requis" }, { status: 400 });
    }

    // Validate entries and only accept known keys
    for (const s of settings) {
      if (!s.key || s.value === undefined) {
        return NextResponse.json(
          { error: `Clé et valeur requises pour chaque paramètre. Reçu: ${JSON.stringify(s)}` },
          { status: 400 }
        );
      }
      if (!SETTING_KEYS[s.key]) {
        return NextResponse.json(
          { error: `Clé de personnalisation inconnue: ${s.key}` },
          { status: 400 }
        );
      }
    }

    // Upsert all settings in a single transaction
    const results = await prisma.$transaction(
      settings.map((s) => {
        const config = SETTING_KEYS[s.key];
        return prisma.setting.upsert({
          where: { key: s.key },
          update: {
            value: s.value as Prisma.InputJsonValue,
            type: config.type,
            category: "customize",
            description: config.description,
          },
          create: {
            key: s.key,
            value: s.value as Prisma.InputJsonValue,
            type: config.type,
            category: "customize",
            description: config.description,
          },
        });
      })
    );

    // Invalider le cache pour que les changements soient immédiatement visibles
    invalidateStoreSettingsCache();

    return NextResponse.json(results);
  } catch (error) {
    console.error("Erreur PUT /api/admin/customize:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
