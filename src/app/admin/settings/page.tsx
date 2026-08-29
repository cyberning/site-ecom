"use client";

import { useEffect, useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";

interface Setting {
  id: string;
  key: string;
  value: unknown;
  type: string;
  category: string;
  description: string | null;
  updatedAt: string;
}

interface CategoryMeta {
  label: string;
  order: number;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  general: { label: "Général", order: 0 },
  theme: { label: "Thème", order: 1 },
  delivery: { label: "Livraison", order: 2 },
};

const LOCALE_OPTIONS = [
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
  { value: "ar", label: "Arabe" },
];

const CURRENCY_OPTIONS = [{ value: "DZD", label: "DZD — Dinar Algérien" }];

// Extracts the display value from the JSON `value` field
// Some settings store the value as a JSON object like `{ value: "..." }`, others as a raw string/number
function extractValue(setting: Setting): string {
  const v = setting.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && !Array.isArray(v)) {
    const obj = v as Record<string, unknown>;
    if ("value" in obj) return String(obj.value);
    return JSON.stringify(v);
  }
  return String(v);
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Track only modified values: key -> new raw value
  const [modified, setModified] = useState<Record<string, string>>({});

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data: Setting[] = await res.json();
      setSettings(data);
    } catch {
      setFeedback({ type: "error", message: "Impossible de charger les paramètres." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key: string, value: string) => {
    setModified((prev) => ({ ...prev, [key]: value }));
    setFeedback(null);
  };

  const handleSave = async () => {
    // active_theme est géré par la page /admin/customize (sauvegarde immédiate
    // cookie + data-theme + DB), il ne doit donc jamais transiter par la
    // sauvegarde globale.
    const entries = Object.entries(modified).filter(([key]) => key !== "active_theme");
    if (entries.length === 0) {
      setFeedback({ type: "error", message: "Aucune modification à sauvegarder." });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      const payload = entries.map(([key, value]) => {
        // Find the original setting to determine how to encode the value
        const original = settings.find((s) => s.key === key);
        const originalRaw = original?.value;

        // If the original was stored as { value: ... }, keep that shape
        if (
          typeof originalRaw === "object" &&
          originalRaw !== null &&
          !Array.isArray(originalRaw) &&
          "value" in (originalRaw as Record<string, unknown>)
        ) {
          // For number types, parse back to number
          const numVal = Number(value);
          const coerced = original?.type === "number" && !isNaN(numVal) ? numVal : value;
          return { key, value: { value: coerced } };
        }

        // For number types, parse back to number
        const numVal = Number(value);
        if (original?.type === "number" && !isNaN(numVal)) {
          return { key, value: numVal };
        }

        return { key, value };
      });

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de la sauvegarde");
      }

      // Refresh settings from server
      await fetchSettings();
      setModified({});
      setFeedback({ type: "success", message: "Paramètres sauvegardés avec succès." });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Erreur inconnue",
      });
    } finally {
      setSaving(false);
    }
  };

  // Group settings by category
  // La catégorie "customize" (clés custom_*) est gérée par la page dédiée /admin/customize :
  // on l'exclut de l'affichage ici pour éviter les champs bruts redondants.
  // active_theme est également exclu : il est géré par le sélecteur de thème de /admin/customize.
  const grouped = settings.reduce<Record<string, Setting[]>>((acc, s) => {
    if (s.category === "customize") return acc;
    if (s.key === "active_theme") return acc;
    const cat = s.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  // Sort categories by defined order
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const orderA = CATEGORY_META[a]?.order ?? 99;
    const orderB = CATEGORY_META[b]?.order ?? 99;
    return orderA - orderB;
  });

  const renderSettingField = (setting: Setting) => {
    const currentValue =
      modified[setting.key] !== undefined ? modified[setting.key] : extractValue(setting);

    const fieldId = `setting-${setting.key}`;

    switch (setting.key) {
      case "active_locale":
        return (
          <Select
            key={setting.key}
            id={fieldId}
            label={setting.description || "Langue active"}
            options={LOCALE_OPTIONS}
            value={currentValue}
            onChange={(e) => handleChange(setting.key, e.target.value)}
          />
        );

      case "currency":
        return (
          <Select
            key={setting.key}
            id={fieldId}
            label={setting.description || "Devise"}
            options={CURRENCY_OPTIONS}
            value={currentValue}
            onChange={(e) => handleChange(setting.key, e.target.value)}
          />
        );

      case "free_shipping_threshold":
        return (
          <Input
            key={setting.key}
            id={fieldId}
            label={setting.description || "Seuil de livraison gratuite (DA)"}
            type="number"
            min={0}
            value={currentValue}
            onChange={(e) => handleChange(setting.key, e.target.value)}
          />
        );

      case "store_name":
        return (
          <Input
            key={setting.key}
            id={fieldId}
            label={setting.description || "Nom de la boutique"}
            type="text"
            value={currentValue}
            onChange={(e) => handleChange(setting.key, e.target.value)}
          />
        );

      case "store_logo":
        return (
          <Input
            key={setting.key}
            id={fieldId}
            label={setting.description || "URL du logo"}
            type="text"
            placeholder="https://..."
            value={currentValue}
            onChange={(e) => handleChange(setting.key, e.target.value)}
          />
        );

      case "active_logistics_provider":
        return (
          <Input
            key={setting.key}
            id={fieldId}
            label={setting.description || "Fournisseur logistique"}
            type="text"
            value={currentValue}
            onChange={(e) => handleChange(setting.key, e.target.value)}
          />
        );

      default:
        // Fallback: generic text input
        return (
          <Input
            key={setting.key}
            id={fieldId}
            label={setting.description || setting.key}
            type="text"
            value={currentValue}
            onChange={(e) => handleChange(setting.key, e.target.value)}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Spinner size="lg" />
        <p className="text-sm text-[var(--text-secondary)]">Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Paramètres</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Configuration de la boutique</p>
        </div>

        <Button onClick={handleSave} disabled={saving || Object.keys(modified).length === 0}>
          {saving ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Sauvegarde...
            </span>
          ) : (
            "Sauvegarder"
          )}
        </Button>
      </div>

      {/* Feedback */}
      {feedback && <Alert type={feedback.type} message={feedback.message} />}

      {/* Settings grouped by category */}
      {sortedCategories.map((cat) => (
        <Card key={cat} className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
            {CATEGORY_META[cat]?.label || cat}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {grouped[cat].map((setting) => renderSettingField(setting))}
          </div>
        </Card>
      ))}

      {settings.length === 0 && (
        <div className="py-12 text-center text-[var(--text-secondary)]">
          Aucun paramètre trouvé.
        </div>
      )}
    </div>
  );
}
