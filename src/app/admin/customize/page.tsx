"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Palette,
  Type,
  Layout,
  MousePointer,
  CreditCard,
  Save,
  RotateCcw,
  Check,
  Eye,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { applyCustomizationsToDocument } from "@/lib/theme";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SettingItem {
  key: string;
  value: string | number;
  type: string;
  category: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Default values (fallback if API doesn't return)
// ---------------------------------------------------------------------------

const DEFAULTS: Record<string, string | number> = {
  custom_store_name: "Nom du magasin",
  custom_store_tagline: "Slogan du magasin",
  custom_footer_text: "Texte du pied de page",
  custom_contact_email: "email@exemple.com",
  custom_contact_phone: "+213 5XX XX XX XX",
  custom_contact_address: "Alger, Algérie",
  custom_accent_color: "#4F46E5",
  custom_bg_primary: "#E0E5EC",
  custom_bg_secondary: "#D1D9E6",
  custom_bg_card: "#E0E5EC",
  custom_text_primary: "#2D3748",
  custom_text_secondary: "#4A5568",
  custom_border_color: "#CBD5E0",
  custom_font_primary: "Inter, sans-serif",
  custom_font_heading: "Inter, sans-serif",
  custom_font_size_base: 16,
  custom_font_size_heading: 24,
  custom_border_radius_sm: 8,
  custom_border_radius_md: 12,
  custom_border_radius_lg: 16,
  custom_border_radius_xl: 24,
  custom_spacing_unit: 4,
  custom_btn_style: "rounded",
  custom_btn_padding_x: 16,
  custom_btn_padding_y: 8,
  custom_btn_font_weight: "medium",
  custom_card_style: "neumorphic",
  custom_card_shadow: "medium",
  custom_card_padding: 24,
  custom_hero_image: "",
  custom_hero_title: "Les meilleurs produits au meilleur prix",
};

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const FONT_OPTIONS = [
  "Inter",
  "Playfair Display",
  "Space Grotesk",
  "Lora",
  "JetBrains Mono",
  "Poppins",
  "Montserrat",
];

const BUTTON_STYLES: { value: string; label: string; preview: string }[] = [
  { value: "rounded", label: "Rond", preview: "rounded-[var(--radius-sm)]" },
  { value: "square", label: "Carré", preview: "rounded-none" },
  { value: "pill", label: "Pill", preview: "rounded-full" },
];

const CARD_STYLES: { value: string; label: string; description: string }[] = [
  { value: "neumorphic", label: "Néomorphique", description: "Ombres douces et effets en relief" },
  { value: "flat", label: "Plat", description: "Design épuré sans ombre" },
  { value: "bordered", label: "Borduré", description: "Contour visible distinct" },
  { value: "elevated", label: "Surélevé", description: "Ombre portée prononcée" },
];

const SHADOW_LEVELS: { value: string; label: string }[] = [
  { value: "none", label: "Aucune" },
  { value: "light", label: "Légère" },
  { value: "medium", label: "Moyenne" },
  { value: "strong", label: "Forte" },
];

const FONT_WEIGHT_OPTIONS = [
  { value: "normal", label: "Normal (400)" },
  { value: "medium", label: "Medium (500)" },
  { value: "bold", label: "Bold (700)" },
];

// ---------------------------------------------------------------------------
// Helper: label from font-family value
// ---------------------------------------------------------------------------

function fontDisplayName(val: string): string {
  return val.replace(/, sans-serif|, serif|, monospace/g, "").trim();
}

// ---------------------------------------------------------------------------
// Small components
// ---------------------------------------------------------------------------

function ColorPicker({
  label,
  settingKey,
  value,
  onChange,
}: {
  label: string;
  settingKey: string;
  value: string;
  onChange: (key: string, val: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={`color-${settingKey}`}
        className="block text-sm font-medium text-[var(--text-primary)]"
      >
        {label}
      </label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            id={`color-${settingKey}`}
            value={value}
            onChange={(e) => onChange(settingKey, e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`Choisir ${label}`}
          />
          <div
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] shadow-sm transition-transform hover:scale-110"
            style={{ backgroundColor: value }}
          />
        </div>
        <div className="flex-1">
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(settingKey, e.target.value)}
            className="font-mono uppercase"
            aria-label={`Valeur hex pour ${label}`}
          />
        </div>
      </div>
    </div>
  );
}

function RangeSlider({
  label,
  settingKey,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  settingKey: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (key: string, val: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={`range-${settingKey}`}
          className="text-sm font-medium text-[var(--text-primary)]"
        >
          {label}
        </label>
        <span className="rounded-full bg-[var(--accent)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--accent)]">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        id={`range-${settingKey}`}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(settingKey, Number(e.target.value))}
        className="w-full cursor-pointer accent-[var(--accent)]"
        aria-label={`${label}: ${value}${unit}`}
      />
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)]/10">
        <Icon className="h-5 w-5 text-[var(--accent)]" />
      </div>
      <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-[var(--radius-sm)] bg-[var(--bg-secondary)]" />
            <div className="h-5 w-40 animate-pulse rounded bg-[var(--bg-secondary)]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-[var(--bg-secondary)]" />
                <div className="h-10 w-full animate-pulse rounded-[var(--radius-sm)] bg-[var(--bg-secondary)]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Boutons d'action Réinitialiser / Sauvegarder (réutilisés en haut et en bas)
function ActionButtons({
  onReset,
  onSave,
  saving,
}: {
  onReset: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-[var(--transition)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
        aria-label="Réinitialiser les paramètres"
      >
        <RotateCcw className="h-4 w-4" />
        Réinitialiser
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-[var(--transition)] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Sauvegarder les paramètres"
      >
        {saving ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saving ? "Sauvegarde..." : "Sauvegarder"}
      </button>
    </>
  );
}

// Aperçu de la bannière hero avec fallback en cas d'erreur d'image
function HeroPreview({ url, onRemove }: { url: string; onRemove: () => void }) {
  const [error, setError] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)]">
      {error ? (
        <div className="flex h-48 w-full flex-col items-center justify-center gap-2 bg-[var(--bg-secondary)] text-[var(--text-muted)]">
          <ImageIcon className="h-8 w-8" aria-hidden="true" />
          <span className="text-sm">Image indisponible</span>
        </div>
      ) : (
        <img
          key={url}
          src={url}
          alt="Aperçu de la bannière"
          className="h-48 w-full object-cover"
          loading="lazy"
          onError={() => setError(true)}
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white transition-[var(--transition)] hover:bg-red-500"
        aria-label="Supprimer l'image"
      >
        ✕
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live Preview Card
// ---------------------------------------------------------------------------

function LivePreviewCard({ values }: { values: Record<string, string | number> }) {
  const accent = String(values.custom_accent_color || DEFAULTS.custom_accent_color);
  const bgCard = String(values.custom_bg_card || DEFAULTS.custom_bg_card);
  const textPrimary = String(values.custom_text_primary || DEFAULTS.custom_text_primary);
  const textSecondary = String(values.custom_text_secondary || DEFAULTS.custom_text_secondary);
  const border = String(values.custom_border_color || DEFAULTS.custom_border_color);
  const radiusSm = Number(values.custom_border_radius_sm ?? DEFAULTS.custom_border_radius_sm);
  const radiusMd = Number(values.custom_border_radius_md ?? DEFAULTS.custom_border_radius_md);
  const radiusLg = Number(values.custom_border_radius_lg ?? DEFAULTS.custom_border_radius_lg);
  const fontSizeBase = Number(values.custom_font_size_base ?? DEFAULTS.custom_font_size_base);
  const fontSizeHeading = Number(
    values.custom_font_size_heading ?? DEFAULTS.custom_font_size_heading
  );
  const btnPadX = Number(values.custom_btn_padding_x ?? DEFAULTS.custom_btn_padding_x);
  const btnPadY = Number(values.custom_btn_padding_y ?? DEFAULTS.custom_btn_padding_y);
  const btnFontWeight = String(values.custom_btn_font_weight || DEFAULTS.custom_btn_font_weight);
  const btnStyle = String(values.custom_btn_style || DEFAULTS.custom_btn_style);
  const cardPadding = Number(values.custom_card_padding ?? DEFAULTS.custom_card_padding);
  const cardStyle = String(values.custom_card_style || DEFAULTS.custom_card_style);
  const cardShadow = String(values.custom_card_shadow || DEFAULTS.custom_card_shadow);
  const spacing = Number(values.custom_spacing_unit ?? DEFAULTS.custom_spacing_unit);

  // Card outer styles
  const cardShadowCSS =
    cardShadow === "none"
      ? "none"
      : cardShadow === "light"
        ? "0 2px 8px rgba(0,0,0,0.08)"
        : cardShadow === "medium"
          ? "0 4px 16px rgba(0,0,0,0.12)"
          : "0 8px 32px rgba(0,0,0,0.2)";

  const cardBorder =
    cardStyle === "bordered"
      ? `2px solid ${border}`
      : cardStyle === "neumorphic"
        ? "none"
        : `1px solid ${border}`;

  const cardRadius =
    cardStyle === "neumorphic" ? `${radiusLg}px` : cardStyle === "flat" ? "0" : `${radiusMd}px`;

  const btnRadius = btnStyle === "pill" ? "9999px" : btnStyle === "square" ? "0" : `${radiusSm}px`;

  const fontWeight = btnFontWeight === "bold" ? "700" : btnFontWeight === "medium" ? "500" : "400";

  return (
    <div
      className="mx-auto max-w-md overflow-hidden"
      style={{
        backgroundColor: bgCard,
        borderRadius: cardRadius,
        border: cardBorder,
        boxShadow: cardShadowCSS,
      }}
    >
      <div style={{ padding: `${cardPadding}px` }}>
        <h3
          className="mb-2 font-bold"
          style={{
            color: textPrimary,
            fontSize: `${fontSizeHeading}px`,
            fontFamily: String(values.custom_font_primary || DEFAULTS.custom_font_primary),
          }}
        >
          {values.custom_store_name || DEFAULTS.custom_store_name}
        </h3>
        <p
          className="mb-4"
          style={{
            color: textSecondary,
            fontSize: `${Math.max(12, fontSizeBase - 2)}px`,
          }}
        >
          {values.custom_store_tagline || String(DEFAULTS.custom_store_tagline)}. Ceci est un aperçu
          en direct de votre personnalisation. Les couleurs, polices et espacements sont mis à jour
          en temps réel.
        </p>
        <button
          style={{
            backgroundColor: accent,
            color: "#fff",
            padding: `${btnPadY}px ${btnPadX}px`,
            borderRadius: btnRadius,
            fontWeight: fontWeight as React.CSSProperties["fontWeight"],
            fontSize: `${fontSizeBase}px`,
            letterSpacing: "0.025em",
            border: "none",
            cursor: "pointer",
          }}
        >
          Ajouter au panier
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminCustomizePage() {
  const [values, setValues] = useState<Record<string, string | number>>({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroUploadError, setHeroUploadError] = useState("");

  // Fetch settings on mount
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/customize");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data: SettingItem[] = await res.json();

      const merged: Record<string, string | number> = { ...DEFAULTS };
      for (const item of data) {
        // parse number types
        if (item.type === "number") {
          merged[item.key] =
            typeof item.value === "number" ? item.value : Number(item.value) || DEFAULTS[item.key];
        } else {
          merged[item.key] = item.value;
        }
      }
      setValues(merged);
      applyCustomizationsToDocument(merged);
    } catch {
      setFeedback({
        type: "error",
        message: "Impossible de charger les paramètres de personnalisation.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update a single value and apply live
  const handleChange = useCallback((key: string, val: string | number) => {
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      applyCustomizationsToDocument(next);
      return next;
    });
    setFeedback(null);
  }, []);

  // Upload hero image
  const handleHeroUpload = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setHeroUploadError("");

      // Validation côté client
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        setHeroUploadError("Type non autorisé. Utilisez JPG, PNG, WebP ou GIF.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setHeroUploadError("Fichier trop volumineux (max 5 MB)");
        return;
      }

      setHeroUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload/hero", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          setHeroUploadError(data.error || "Erreur lors de l'upload");
          return;
        }
        // Mettre à jour la valeur de l'image hero avec l'URL retournée
        handleChange("custom_hero_image", data.url);
      } catch {
        setHeroUploadError("Erreur réseau lors de l'upload");
      } finally {
        setHeroUploading(false);
      }
    },
    [handleChange]
  );

  // Reset to defaults
  const handleReset = useCallback(() => {
    setValues({ ...DEFAULTS });
    applyCustomizationsToDocument(DEFAULTS);
    setFeedback(null);
  }, []);

  // Save to API
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setFeedback(null);

      const payload = Object.entries(values).map(([key, value]) => ({ key, value }));
      const res = await fetch("/api/admin/customize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de la sauvegarde");
      }

      setFeedback({ type: "success", message: "Personnalisation sauvegardée avec succès." });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Erreur inconnue",
      });
    } finally {
      setSaving(false);
    }
  }, [values]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Personnalisation du Frontend
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Configurez l&apos;apparence de votre boutique
          </p>
        </div>
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Personnalisation du Frontend
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Configurez l&apos;apparence de votre boutique
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ActionButtons onReset={handleReset} onSave={handleSave} saving={saving} />
        </div>
      </div>

      {/* ---- Feedback ---- */}
      {feedback && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-[var(--radius-sm)] border px-4 py-3 text-sm",
            feedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          )}
          role="alert"
        >
          {feedback.type === "success" ? <Check className="h-4 w-4 flex-shrink-0" /> : null}
          {feedback.message}
        </div>
      )}

      {/* ================================================================
          SECTION: Identité de la marque
          ================================================================ */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <SectionHeader icon={Palette} title="Identité de la marque" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="store-name"
            label="Nom du magasin"
            type="text"
            value={String(values.custom_store_name)}
            onChange={(e) => handleChange("custom_store_name", e.target.value)}
          />
          <Input
            id="store-tagline"
            label="Slogan"
            type="text"
            value={String(values.custom_store_tagline)}
            onChange={(e) => handleChange("custom_store_tagline", e.target.value)}
          />
          <div className="space-y-1 sm:col-span-2">
            <label
              htmlFor="footer-text"
              className="block text-sm font-medium text-[var(--text-primary)]"
            >
              Texte du pied de page
            </label>
            <textarea
              id="footer-text"
              rows={3}
              value={String(values.custom_footer_text)}
              onChange={(e) => handleChange("custom_footer_text", e.target.value)}
              className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] transition-[var(--transition)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
            />
          </div>
          <Input
            id="contact-email"
            label="Email de contact"
            type="email"
            value={String(values.custom_contact_email)}
            onChange={(e) => handleChange("custom_contact_email", e.target.value)}
          />
          <Input
            id="contact-phone"
            label="Téléphone"
            type="tel"
            value={String(values.custom_contact_phone)}
            onChange={(e) => handleChange("custom_contact_phone", e.target.value)}
          />
          <div className="sm:col-span-2">
            <Input
              id="contact-address"
              label="Adresse"
              type="text"
              value={String(values.custom_contact_address)}
              onChange={(e) => handleChange("custom_contact_address", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION: Bannière Hero
          ================================================================ */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <SectionHeader icon={Palette} title="Bannière Hero" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              id="hero-title"
              label="Titre de la bannière"
              type="text"
              value={String(values.custom_hero_title)}
              onChange={(e) => handleChange("custom_hero_title", e.target.value)}
              placeholder="Les meilleurs produits au meilleur prix"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Image de bannière
            </label>

            {/* Upload zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0] || null;
                handleHeroUpload(file);
              }}
              className={`flex flex-col items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed p-6 text-center transition-[var(--transition)] ${
                heroUploading
                  ? "border-[var(--accent)] bg-[var(--accent-light)]"
                  : "border-[var(--border)] hover:border-[var(--accent)]"
              }`}
            >
              {heroUploading ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)]" />
                  <span className="text-sm text-[var(--text-muted)]">Upload en cours...</span>
                </div>
              ) : (
                <>
                  <ImageIcon className="h-10 w-10 text-[var(--text-muted)]" aria-hidden="true" />
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Glissez-déposez ou cliquez pour uploader une image
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    JPG, PNG, WebP, GIF — max 5 MB
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => handleHeroUpload(e.target.files?.[0] || null)}
                    className="hidden"
                    id="hero-file-upload"
                  />
                  <label
                    htmlFor="hero-file-upload"
                    className="mt-3 cursor-pointer rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-[var(--transition)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Sélectionner un fichier
                  </label>
                </>
              )}
            </div>

            {heroUploadError && <p className="text-sm text-red-500">{heroUploadError}</p>}

            {/* Champ URL manuel (optionnel) */}
            <div>
              <Input
                id="hero-image-url"
                label="Ou saisir une URL manuellement"
                type="url"
                value={String(values.custom_hero_image)}
                onChange={(e) => handleChange("custom_hero_image", e.target.value)}
                placeholder="https://exemple.com/image.jpg"
              />
            </div>

            {/* Aperçu de l'image */}
            {values.custom_hero_image && (
              <HeroPreview
                url={String(values.custom_hero_image)}
                onRemove={() => handleChange("custom_hero_image", "")}
              />
            )}
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION: Couleurs
          ================================================================ */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <SectionHeader icon={Palette} title="Couleurs" />
        <div className="grid gap-5 sm:grid-cols-2">
          <ColorPicker
            label="Couleur d'accentuation"
            settingKey="custom_accent_color"
            value={String(values.custom_accent_color)}
            onChange={handleChange}
          />
          <ColorPicker
            label="Fond principal"
            settingKey="custom_bg_primary"
            value={String(values.custom_bg_primary)}
            onChange={handleChange}
          />
          <ColorPicker
            label="Fond secondaire"
            settingKey="custom_bg_secondary"
            value={String(values.custom_bg_secondary)}
            onChange={handleChange}
          />
          <ColorPicker
            label="Fond des cartes"
            settingKey="custom_bg_card"
            value={String(values.custom_bg_card)}
            onChange={handleChange}
          />
          <ColorPicker
            label="Texte principal"
            settingKey="custom_text_primary"
            value={String(values.custom_text_primary)}
            onChange={handleChange}
          />
          <ColorPicker
            label="Texte secondaire"
            settingKey="custom_text_secondary"
            value={String(values.custom_text_secondary)}
            onChange={handleChange}
          />
          <ColorPicker
            label="Couleur des bordures"
            settingKey="custom_border_color"
            value={String(values.custom_border_color)}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ================================================================
          SECTION: Typographie
          ================================================================ */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <SectionHeader icon={Type} title="Typographie" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="font-primary"
            label="Police principale"
            value={fontDisplayName(String(values.custom_font_primary))}
            onChange={(e) => {
              const font = e.target.value;
              const familyStr =
                font.includes(" ") && !font.includes(",")
                  ? `${font}, sans-serif`
                  : font.includes("Mono")
                    ? `${font}, monospace`
                    : font.includes("Playfair") || font.includes("Lora")
                      ? `${font}, serif`
                      : `${font}, sans-serif`;
              handleChange("custom_font_primary", familyStr);
            }}
            options={FONT_OPTIONS.map((f) => ({ value: f, label: f }))}
          />
          <Select
            id="font-heading"
            label="Police des titres"
            value={fontDisplayName(String(values.custom_font_heading))}
            onChange={(e) => {
              const font = e.target.value;
              const familyStr =
                font.includes(" ") && !font.includes(",")
                  ? `${font}, sans-serif`
                  : font.includes("Mono")
                    ? `${font}, monospace`
                    : font.includes("Playfair") || font.includes("Lora")
                      ? `${font}, serif`
                      : `${font}, sans-serif`;
              handleChange("custom_font_heading", familyStr);
            }}
            options={FONT_OPTIONS.map((f) => ({ value: f, label: f }))}
          />
          <RangeSlider
            label="Taille de base"
            settingKey="custom_font_size_base"
            value={Number(values.custom_font_size_base)}
            min={12}
            max={24}
            unit="px"
            onChange={handleChange}
          />
          <RangeSlider
            label="Taille des titres"
            settingKey="custom_font_size_heading"
            value={Number(values.custom_font_size_heading)}
            min={18}
            max={48}
            unit="px"
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ================================================================
          SECTION: Mise en page
          ================================================================ */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <SectionHeader icon={Layout} title="Mise en page" />
        <div className="grid gap-4 sm:grid-cols-2">
          <RangeSlider
            label="Border radius — SM"
            settingKey="custom_border_radius_sm"
            value={Number(values.custom_border_radius_sm)}
            min={0}
            max={32}
            unit="px"
            onChange={handleChange}
          />
          <RangeSlider
            label="Border radius — MD"
            settingKey="custom_border_radius_md"
            value={Number(values.custom_border_radius_md)}
            min={0}
            max={32}
            unit="px"
            onChange={handleChange}
          />
          <RangeSlider
            label="Border radius — LG"
            settingKey="custom_border_radius_lg"
            value={Number(values.custom_border_radius_lg)}
            min={0}
            max={32}
            unit="px"
            onChange={handleChange}
          />
          <RangeSlider
            label="Border radius — XL"
            settingKey="custom_border_radius_xl"
            value={Number(values.custom_border_radius_xl)}
            min={0}
            max={32}
            unit="px"
            onChange={handleChange}
          />
          <RangeSlider
            label="Unité d'espacement"
            settingKey="custom_spacing_unit"
            value={Number(values.custom_spacing_unit)}
            min={2}
            max={8}
            unit="px"
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ================================================================
          SECTION: Boutons
          ================================================================ */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <SectionHeader icon={MousePointer} title="Boutons" />

        {/* Style selector cards */}
        <div className="mb-5">
          <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">Style</p>
          <div className="grid grid-cols-3 gap-3">
            {BUTTON_STYLES.map((style) => {
              const isSelected = values.custom_btn_style === style.value;
              return (
                <button
                  key={style.value}
                  onClick={() => handleChange("custom_btn_style", style.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-[var(--radius-md)] border-2 p-4 transition-[var(--transition)]",
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/40"
                  )}
                  aria-pressed={isSelected}
                  aria-label={`Style ${style.label}`}
                >
                  <div
                    className={cn("h-4 w-16 bg-[var(--accent)] transition-all", style.preview)}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isSelected ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"
                    )}
                  >
                    {style.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <RangeSlider
            label="Padding horizontal"
            settingKey="custom_btn_padding_x"
            value={Number(values.custom_btn_padding_x)}
            min={4}
            max={48}
            unit="px"
            onChange={handleChange}
          />
          <RangeSlider
            label="Padding vertical"
            settingKey="custom_btn_padding_y"
            value={Number(values.custom_btn_padding_y)}
            min={2}
            max={24}
            unit="px"
            onChange={handleChange}
          />
          <Select
            id="btn-font-weight"
            label="Épaisseur de police"
            value={String(values.custom_btn_font_weight)}
            onChange={(e) => handleChange("custom_btn_font_weight", e.target.value)}
            options={FONT_WEIGHT_OPTIONS}
          />
        </div>
      </div>

      {/* ================================================================
          SECTION: Cartes
          ================================================================ */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <SectionHeader icon={CreditCard} title="Cartes" />

        {/* Card style selector */}
        <div className="mb-5">
          <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">Style</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CARD_STYLES.map((style) => {
              const isSelected = values.custom_card_style === style.value;
              return (
                <button
                  key={style.value}
                  onClick={() => handleChange("custom_card_style", style.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-[var(--radius-md)] border-2 p-4 transition-[var(--transition)]",
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/40"
                  )}
                  aria-pressed={isSelected}
                  aria-label={`Style ${style.label}`}
                >
                  <div
                    className="h-10 w-full rounded bg-[var(--bg-card)]"
                    style={{
                      boxShadow:
                        style.value === "neumorphic"
                          ? "4px 4px 8px var(--shadow-dark, #ccc), -4px -4px 8px var(--shadow-light, #fff)"
                          : style.value === "elevated"
                            ? "0 8px 16px rgba(0,0,0,0.2)"
                            : style.value === "bordered"
                              ? `2px solid var(--border)`
                              : "none",
                      border:
                        style.value === "bordered"
                          ? "2px solid var(--border)"
                          : "1px solid var(--border)",
                    }}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isSelected ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"
                    )}
                  >
                    {style.label}
                  </span>
                  <span className="text-center text-[10px] leading-tight text-[var(--text-muted)]">
                    {style.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shadow level selector */}
        <div className="mb-5">
          <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">Niveau d&apos;ombre</p>
          <div className="grid grid-cols-4 gap-3">
            {SHADOW_LEVELS.map((level) => {
              const isSelected = values.custom_card_shadow === level.value;
              const shadowPreview =
                level.value === "none"
                  ? "none"
                  : level.value === "light"
                    ? "0 2px 6px rgba(0,0,0,0.08)"
                    : level.value === "medium"
                      ? "0 4px 12px rgba(0,0,0,0.12)"
                      : "0 8px 24px rgba(0,0,0,0.22)";
              return (
                <button
                  key={level.value}
                  onClick={() => handleChange("custom_card_shadow", level.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-[var(--radius-md)] border-2 p-3 transition-[var(--transition)]",
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/40"
                  )}
                  aria-pressed={isSelected}
                  aria-label={`Ombre ${level.label}`}
                >
                  <div
                    className="h-8 w-full rounded-[var(--radius-sm)] bg-[var(--bg-card)]"
                    style={{ boxShadow: shadowPreview }}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isSelected ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"
                    )}
                  >
                    {level.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-w-xs">
          <RangeSlider
            label="Padding des cartes"
            settingKey="custom_card_padding"
            value={Number(values.custom_card_padding)}
            min={8}
            max={48}
            unit="px"
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ================================================================
          SECTION: Aperçu en direct
          ================================================================ */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)]/10">
            <Eye className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Aperçu en direct</h2>
        </div>
        <p className="mb-5 text-sm text-[var(--text-secondary)]">
          Aperçu de votre boutique avec les paramètres actuels. Les modifications sont appliquées en
          temps réel.
        </p>
        <LivePreviewCard values={values} />
      </div>

      {/* ---- Bottom actions (mobile-friendly sticky) ---- */}
      <div className="sticky bottom-0 -mx-2 flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--bg-primary)] pt-4 pb-2 sm:static sm:border-t-0 sm:bg-transparent sm:pt-0 sm:pb-0">
        <ActionButtons onReset={handleReset} onSave={handleSave} saving={saving} />
      </div>
    </div>
  );
}
