"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
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
  SwatchBook,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { applyCustomizationsToDocument } from "@/lib/theme";
import { getThemeDefaults, BRAND_DEFAULTS } from "@/lib/themeDefaults";
import { useTheme } from "@/providers/ThemeProvider";
import { type ThemeType } from "@/lib/themes";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
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

const BUTTON_STYLES: { value: string; labelKey: string; preview: string }[] = [
  { value: "rounded", labelKey: "buttonStyleRounded", preview: "rounded-[var(--radius-sm)]" },
  { value: "square", labelKey: "buttonStyleSquare", preview: "rounded-none" },
  { value: "pill", labelKey: "buttonStylePill", preview: "rounded-full" },
];

const CARD_STYLES: { value: string; labelKey: string; descriptionKey: string }[] = [
  {
    value: "neumorphic",
    labelKey: "cardStyleNeumorphic",
    descriptionKey: "cardStyleNeumorphicDesc",
  },
  { value: "flat", labelKey: "cardStyleFlat", descriptionKey: "cardStyleFlatDesc" },
  { value: "bordered", labelKey: "cardStyleBordered", descriptionKey: "cardStyleBorderedDesc" },
  { value: "elevated", labelKey: "cardStyleElevated", descriptionKey: "cardStyleElevatedDesc" },
];

const SHADOW_LEVELS: { value: string; labelKey: string }[] = [
  { value: "none", labelKey: "shadowNone" },
  { value: "light", labelKey: "shadowLight" },
  { value: "medium", labelKey: "shadowMedium" },
  { value: "strong", labelKey: "shadowStrong" },
];

const FONT_WEIGHT_OPTIONS = [
  { value: "normal", labelKey: "weightNormal" },
  { value: "medium", labelKey: "weightMedium" },
  { value: "bold", labelKey: "weightBold" },
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
  t,
}: {
  label: string;
  settingKey: string;
  value: string;
  onChange: (key: string, val: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
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
            aria-label={t("customizePage.chooseColor", { label })}
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
            aria-label={t("customizePage.hexValue", { label })}
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
  t,
}: {
  label: string;
  settingKey: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (key: string, val: number) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
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
        aria-label={t("customizePage.rangeValue", { label, value, unit })}
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
  t,
}: {
  onReset: () => void;
  onSave: () => void;
  saving: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-[var(--transition)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
        aria-label={t("customizePage.resetAria")}
      >
        <RotateCcw className="h-4 w-4" />
        {t("customizePage.reset")}
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-[var(--transition)] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={t("customizePage.saveAria")}
      >
        {saving ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saving ? t("customizePage.saving") : t("customizePage.save")}
      </button>
    </>
  );
}

// Aperçu de la bannière hero avec fallback en cas d'erreur d'image
function HeroPreview({
  url,
  onRemove,
  t,
}: {
  url: string;
  onRemove: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const [error, setError] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)]">
      {error ? (
        <div className="flex h-48 w-full flex-col items-center justify-center gap-2 bg-[var(--bg-secondary)] text-[var(--text-muted)]">
          <ImageIcon className="h-8 w-8" aria-hidden="true" />
          <span className="text-sm">{t("customizePage.imageUnavailable")}</span>
        </div>
      ) : (
        <img
          key={url}
          src={url}
          alt={t("customizePage.heroPreviewAlt")}
          className="h-48 w-full object-cover"
          loading="lazy"
          onError={() => setError(true)}
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white transition-[var(--transition)] hover:bg-red-500"
        aria-label={t("customizePage.deleteImageAria")}
      >
        ✕
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live Preview Card
// ---------------------------------------------------------------------------

function LivePreviewCard({
  values,
  t,
}: {
  values: Record<string, string | number>;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const { theme } = useTheme();
  const fallback = getThemeDefaults(theme);
  const accent = String(values.custom_accent_color || fallback.custom_accent_color);
  const bgCard = String(values.custom_bg_card || fallback.custom_bg_card);
  const textPrimary = String(values.custom_text_primary || fallback.custom_text_primary);
  const textSecondary = String(values.custom_text_secondary || fallback.custom_text_secondary);
  const border = String(values.custom_border_color || fallback.custom_border_color);
  const radiusSm = Number(values.custom_border_radius_sm ?? fallback.custom_border_radius_sm);
  const radiusMd = Number(values.custom_border_radius_md ?? fallback.custom_border_radius_md);
  const radiusLg = Number(values.custom_border_radius_lg ?? fallback.custom_border_radius_lg);
  const fontSizeBase = Number(values.custom_font_size_base ?? fallback.custom_font_size_base);
  const fontSizeHeading = Number(
    values.custom_font_size_heading ?? fallback.custom_font_size_heading
  );
  const btnPadX = Number(values.custom_btn_padding_x ?? fallback.custom_btn_padding_x);
  const btnPadY = Number(values.custom_btn_padding_y ?? fallback.custom_btn_padding_y);
  const btnFontWeight = String(values.custom_btn_font_weight || fallback.custom_btn_font_weight);
  const btnStyle = String(values.custom_btn_style || fallback.custom_btn_style);
  const cardPadding = Number(values.custom_card_padding ?? fallback.custom_card_padding);
  const cardStyle = String(values.custom_card_style || fallback.custom_card_style);
  const cardShadow = String(values.custom_card_shadow || fallback.custom_card_shadow);
  const spacing = Number(values.custom_spacing_unit ?? fallback.custom_spacing_unit);

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
            fontFamily: String(values.custom_font_primary || fallback.custom_font_primary),
          }}
        >
          {values.custom_store_name || fallback.custom_store_name}
        </h3>
        <p
          className="mb-4"
          style={{
            color: textSecondary,
            fontSize: `${Math.max(12, fontSizeBase - 2)}px`,
          }}
        >
          {values.custom_store_tagline || String(fallback.custom_store_tagline)}.{" "}
          {t("customizePage.livePreviewText")}
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
          {t("customizePage.addToCart")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminCustomizePage() {
  const { theme } = useTheme();
  const t = useTranslations("admin");
  const [values, setValues] = useState<Record<string, string | number>>(() => ({
    ...getThemeDefaults(theme),
  }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroUploadError, setHeroUploadError] = useState("");

  // Référence du thème courant : le chargement initial des valeurs DB ne doit
  // PAS se relancer à chaque changement de thème (sinon il écraserait le
  // pré-remplissage du formulaire par les défauts du thème sélectionné).
  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // Fetch settings on mount
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/customize");
      if (!res.ok) throw new Error(t("customizePage.loadError"));
      const data: SettingItem[] = await res.json();

      const defaults = getThemeDefaults(themeRef.current);
      const merged: Record<string, string | number> = { ...defaults };
      for (const item of data) {
        // parse number types
        if (item.type === "number") {
          // NB : ne pas utiliser `Number(item.value) || défaut` — le `||`
          // casserait la valeur légitime 0 (ex. rayons LUXURY = 0).
          const n = Number(item.value);
          merged[item.key] = Number.isNaN(n) ? defaults[item.key] : n;
        } else {
          merged[item.key] = item.value;
        }
      }
      setValues(merged);
      applyCustomizationsToDocument(merged);
    } catch {
      setFeedback({
        type: "error",
        message: t("customizePage.loadError2"),
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
        setHeroUploadError(t("customizePage.uploadTypeError"));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setHeroUploadError(t("customizePage.uploadSizeError"));
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
          setHeroUploadError(data.error || t("customizePage.uploadError"));
          return;
        }
        // Mettre à jour la valeur de l'image hero avec l'URL retournée
        handleChange("custom_hero_image", data.url);
      } catch {
        setHeroUploadError(t("customizePage.networkError"));
      } finally {
        setHeroUploading(false);
      }
    },
    [handleChange]
  );

  // Reset to defaults
  const handleReset = useCallback(() => {
    const defaults = getThemeDefaults(theme);
    setValues({ ...defaults });
    applyCustomizationsToDocument(defaults);
    setFeedback(null);
  }, [theme]);

  // Sélection d'un thème : pré-remplit le formulaire avec les défauts du thème
  // (comportement "reset vers ce thème"). setTheme est déjà appelé par
  // ThemeSwitcher (cookie + data-theme + sauvegarde active_theme en DB).
  const handleThemeSelect = useCallback((t: ThemeType) => {
    const defaults = getThemeDefaults(t);
    // Ne pré-remplir que les clés de style, conserver les valeurs de marque courantes
    const styleDefaults = Object.fromEntries(
      Object.entries(defaults).filter(([key]) => !(key in BRAND_DEFAULTS))
    );
    setValues((prev) => ({ ...prev, ...styleDefaults }));
    applyCustomizationsToDocument({ ...defaults }); // le document peut appliquer tout
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
        throw new Error(err.error || t("customizePage.saveError"));
      }

      setFeedback({ type: "success", message: t("customizePage.saved") });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : t("customizePage.unknownError"),
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
            {t("customizePage.title")}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{t("customizePage.subtitle")}</p>
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
            {t("customizePage.title")}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{t("customizePage.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <ActionButtons onReset={handleReset} onSave={handleSave} saving={saving} t={t} />
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
          SECTION: Sélecteur de thème
          ================================================================ */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <SectionHeader icon={SwatchBook} title={t("customizePage.themeSection")} />
        <p className="mb-5 text-sm text-[var(--text-secondary)]">
          {t("customizePage.themeExplanation")}
        </p>
        <ThemeSwitcher onSelect={handleThemeSelect} />
      </div>

      {/* ================================================================
          SECTION: Identité de la marque
          ================================================================ */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <SectionHeader icon={Palette} title={t("customizePage.brandSection")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="store-name"
            label={t("customizePage.storeName")}
            type="text"
            value={String(values.custom_store_name)}
            onChange={(e) => handleChange("custom_store_name", e.target.value)}
          />
          <Input
            id="store-tagline"
            label={t("customizePage.slogan")}
            type="text"
            value={String(values.custom_store_tagline)}
            onChange={(e) => handleChange("custom_store_tagline", e.target.value)}
          />
          <div className="space-y-1 sm:col-span-2">
            <label
              htmlFor="footer-text"
              className="block text-sm font-medium text-[var(--text-primary)]"
            >
              {t("customizePage.footerText")}
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
            label={t("customizePage.contactEmail")}
            type="email"
            value={String(values.custom_contact_email)}
            onChange={(e) => handleChange("custom_contact_email", e.target.value)}
          />
          <Input
            id="contact-phone"
            label={t("customizePage.phone")}
            type="tel"
            value={String(values.custom_contact_phone)}
            onChange={(e) => handleChange("custom_contact_phone", e.target.value)}
          />
          <div className="sm:col-span-2">
            <Input
              id="contact-address"
              label={t("customizePage.address")}
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
        <SectionHeader icon={Palette} title={t("customizePage.heroSection")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              id="hero-title"
              label={t("customizePage.heroTitle")}
              type="text"
              value={String(values.custom_hero_title)}
              onChange={(e) => handleChange("custom_hero_title", e.target.value)}
              placeholder={t("customizePage.heroTitlePlaceholder")}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              {t("customizePage.heroImage")}
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
                  <span className="text-sm text-[var(--text-muted)]">
                    {t("customizePage.uploading")}
                  </span>
                </div>
              ) : (
                <>
                  <ImageIcon className="h-10 w-10 text-[var(--text-muted)]" aria-hidden="true" />
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {t("customizePage.dropzone")}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {t("customizePage.fileTypes")}
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
                    {t("customizePage.selectFile")}
                  </label>
                </>
              )}
            </div>

            {heroUploadError && <p className="text-sm text-red-500">{heroUploadError}</p>}

            {/* Champ URL manuel (optionnel) */}
            <div>
              <Input
                id="hero-image-url"
                label={t("customizePage.manualUrl")}
                type="url"
                value={String(values.custom_hero_image)}
                onChange={(e) => handleChange("custom_hero_image", e.target.value)}
                placeholder={t("customizePage.urlPlaceholder")}
              />
            </div>

            {/* Aperçu de l'image */}
            {values.custom_hero_image && (
              <HeroPreview
                url={String(values.custom_hero_image)}
                onRemove={() => handleChange("custom_hero_image", "")}
                t={t}
              />
            )}
          </div>
        </div>
      </div>

      {/* ================================================================
          SECTION: Couleurs
          ================================================================ */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <SectionHeader icon={Palette} title={t("customizePage.colorsSection")} />
        <div className="grid gap-5 sm:grid-cols-2">
          <ColorPicker
            label={t("customizePage.accentColor")}
            settingKey="custom_accent_color"
            value={String(values.custom_accent_color)}
            onChange={handleChange}
            t={t}
          />
          <ColorPicker
            label={t("customizePage.primaryBg")}
            settingKey="custom_bg_primary"
            value={String(values.custom_bg_primary)}
            onChange={handleChange}
            t={t}
          />
          <ColorPicker
            label={t("customizePage.secondaryBg")}
            settingKey="custom_bg_secondary"
            value={String(values.custom_bg_secondary)}
            onChange={handleChange}
            t={t}
          />
          <ColorPicker
            label={t("customizePage.cardBg")}
            settingKey="custom_bg_card"
            value={String(values.custom_bg_card)}
            onChange={handleChange}
            t={t}
          />
          <ColorPicker
            label={t("customizePage.primaryText")}
            settingKey="custom_text_primary"
            value={String(values.custom_text_primary)}
            onChange={handleChange}
            t={t}
          />
          <ColorPicker
            label={t("customizePage.secondaryText")}
            settingKey="custom_text_secondary"
            value={String(values.custom_text_secondary)}
            onChange={handleChange}
            t={t}
          />
          <ColorPicker
            label={t("customizePage.borderColor")}
            settingKey="custom_border_color"
            value={String(values.custom_border_color)}
            onChange={handleChange}
            t={t}
          />
        </div>
      </div>

      {/* ================================================================
          SECTION: Typographie
          ================================================================ */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <SectionHeader icon={Type} title={t("customizePage.typographySection")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="font-primary"
            label={t("customizePage.primaryFont")}
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
            label={t("customizePage.headingFont")}
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
            label={t("customizePage.baseSize")}
            settingKey="custom_font_size_base"
            value={Number(values.custom_font_size_base)}
            min={12}
            max={24}
            unit="px"
            onChange={handleChange}
            t={t}
          />
          <RangeSlider
            label={t("customizePage.headingSize")}
            settingKey="custom_font_size_heading"
            value={Number(values.custom_font_size_heading)}
            min={18}
            max={48}
            unit="px"
            onChange={handleChange}
            t={t}
          />
        </div>
      </div>

      {/* ================================================================
          SECTION: Mise en page
          ================================================================ */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <SectionHeader icon={Layout} title={t("customizePage.layoutSection")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <RangeSlider
            label={t("customizePage.radiusSm")}
            settingKey="custom_border_radius_sm"
            value={Number(values.custom_border_radius_sm)}
            min={0}
            max={32}
            unit="px"
            onChange={handleChange}
            t={t}
          />
          <RangeSlider
            label={t("customizePage.radiusMd")}
            settingKey="custom_border_radius_md"
            value={Number(values.custom_border_radius_md)}
            min={0}
            max={32}
            unit="px"
            onChange={handleChange}
            t={t}
          />
          <RangeSlider
            label={t("customizePage.radiusLg")}
            settingKey="custom_border_radius_lg"
            value={Number(values.custom_border_radius_lg)}
            min={0}
            max={32}
            unit="px"
            onChange={handleChange}
            t={t}
          />
          <RangeSlider
            label={t("customizePage.radiusXl")}
            settingKey="custom_border_radius_xl"
            value={Number(values.custom_border_radius_xl)}
            min={0}
            max={32}
            unit="px"
            onChange={handleChange}
            t={t}
          />
          <RangeSlider
            label={t("customizePage.spacingUnit")}
            settingKey="custom_spacing_unit"
            value={Number(values.custom_spacing_unit)}
            min={2}
            max={8}
            unit="px"
            onChange={handleChange}
            t={t}
          />
        </div>
      </div>

      {/* ================================================================
          SECTION: Boutons
          ================================================================ */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <SectionHeader icon={MousePointer} title={t("customizePage.buttonsSection")} />

        {/* Style selector cards */}
        <div className="mb-5">
          <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">
            {t("customizePage.buttonStyle")}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {BUTTON_STYLES.map((style) => {
              const isSelected = values.custom_btn_style === style.value;
              const styleLabel = t(`customizePage.${style.labelKey}`);
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
                  aria-label={t("customizePage.styleLabel", { label: styleLabel })}
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
                    {styleLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <RangeSlider
            label={t("customizePage.paddingX")}
            settingKey="custom_btn_padding_x"
            value={Number(values.custom_btn_padding_x)}
            min={4}
            max={48}
            unit="px"
            onChange={handleChange}
            t={t}
          />
          <RangeSlider
            label={t("customizePage.paddingY")}
            settingKey="custom_btn_padding_y"
            value={Number(values.custom_btn_padding_y)}
            min={2}
            max={24}
            unit="px"
            onChange={handleChange}
            t={t}
          />
          <Select
            id="btn-font-weight"
            label={t("customizePage.fontWeight")}
            value={String(values.custom_btn_font_weight)}
            onChange={(e) => handleChange("custom_btn_font_weight", e.target.value)}
            options={FONT_WEIGHT_OPTIONS.map((o) => ({
              value: o.value,
              label: t(`customizePage.${o.labelKey}`),
            }))}
          />
        </div>
      </div>

      {/* ================================================================
          SECTION: Cartes
          ================================================================ */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <SectionHeader icon={CreditCard} title={t("customizePage.cardsSection")} />

        {/* Card style selector */}
        <div className="mb-5">
          <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">
            {t("customizePage.cardStyle")}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CARD_STYLES.map((style) => {
              const isSelected = values.custom_card_style === style.value;
              const styleLabel = t(`customizePage.${style.labelKey}`);
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
                  aria-label={t("customizePage.styleLabel", { label: styleLabel })}
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
                    {styleLabel}
                  </span>
                  <span className="text-center text-[10px] leading-tight text-[var(--text-muted)]">
                    {t(`customizePage.${style.descriptionKey}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shadow level selector */}
        <div className="mb-5">
          <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">
            {t("customizePage.cardShadow")}
          </p>
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
              const levelLabel = t(`customizePage.${level.labelKey}`);
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
                  aria-label={t("customizePage.shadowLabel", { label: levelLabel })}
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
                    {levelLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-w-xs">
          <RangeSlider
            label={t("customizePage.cardPadding")}
            settingKey="custom_card_padding"
            value={Number(values.custom_card_padding)}
            min={8}
            max={48}
            unit="px"
            onChange={handleChange}
            t={t}
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
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {t("customizePage.livePreviewSection")}
          </h2>
        </div>
        <p className="mb-5 text-sm text-[var(--text-secondary)]">
          {t("customizePage.livePreviewDesc")}
        </p>
        <LivePreviewCard values={values} t={t} />
      </div>

      {/* ---- Bottom actions (mobile-friendly sticky) ---- */}
      <div className="sticky bottom-0 -mx-2 flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--bg-primary)] pt-4 pb-2 sm:static sm:border-t-0 sm:bg-transparent sm:pt-0 sm:pb-0">
        <ActionButtons onReset={handleReset} onSave={handleSave} saving={saving} t={t} />
      </div>
    </div>
  );
}
