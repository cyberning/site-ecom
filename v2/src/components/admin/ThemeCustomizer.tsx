"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import type { Setting } from "@/types/admin";

// Maps a theme setting key to a CSS variable name and a human label key.
const THEME_FIELDS = [
  { key: "accent", cssVar: "--accent", labelKey: "accentColor" },
  { key: "accentHover", cssVar: "--accent-hover", labelKey: "accentHover" },
  { key: "bgPrimary", cssVar: "--bg-primary", labelKey: "bgPrimary" },
  { key: "bgSecondary", cssVar: "--bg-secondary", labelKey: "bgSecondary" },
  { key: "textPrimary", cssVar: "--text-primary", labelKey: "textPrimary" },
  { key: "textSecondary", cssVar: "--text-secondary", labelKey: "textSecondary" },
  { key: "border", cssVar: "--border", labelKey: "border" },
] as const;

function parseValue(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : String(parsed);
  } catch {
    return raw;
  }
}

export function ThemeCustomizer({ settings }: { settings: Setting[] }) {
  const t = useTranslations("admin");
  const router = useRouter();

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of THEME_FIELDS) {
      const setting = settings.find((s) => s.key === field.key);
      initial[field.key] = setting ? parseValue(setting.value) : "";
    }
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Apply changes live on the <html> element via CSS variables.
  useEffect(() => {
    const root = document.documentElement;
    for (const field of THEME_FIELDS) {
      const value = values[field.key];
      if (value) {
        root.style.setProperty(field.cssVar, value);
      }
    }
  }, [values]);

  function update(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setLoading(true);
    setMessage(null);
    setError(null);

    const payload = THEME_FIELDS.map((field) => ({
      key: field.key,
      value: values[field.key] || "",
    }));

    try {
      const res = await fetch("/api/admin/customize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? t("error"));
        setLoading(false);
        return;
      }

      setMessage(t("themeSaved"));
      router.refresh();
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    const root = document.documentElement;
    for (const field of THEME_FIELDS) {
      root.style.removeProperty(field.cssVar);
    }
    setValues(
      Object.fromEntries(THEME_FIELDS.map((field) => [field.key, ""])),
    );
  }

  const inputClass =
    "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]";

  return (
    <div className="max-w-xl space-y-4 rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
      <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
        {t("themeCustomizer")}
      </h2>

      <div className="space-y-4">
        {THEME_FIELDS.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={`theme-${field.key}`}
              className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
            >
              {t(field.labelKey)}
            </label>
            <div className="flex items-center gap-3">
              <input
                id={`theme-${field.key}`}
                type="color"
                value={values[field.key] || "#000000"}
                onChange={(e) => update(field.key, e.target.value)}
                className="h-10 w-14 shrink-0 cursor-pointer rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-input)]"
              />
              <input
                type="text"
                value={values[field.key]}
                onChange={(e) => update(field.key, e.target.value)}
                placeholder="#6366f1"
                className={inputClass}
              />
            </div>
          </div>
        ))}
      </div>

      {message && (
        <p
          role="status"
          className="rounded-[var(--radius-md)] bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-[var(--btn-radius)] bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {t("saveTheme")}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-[var(--btn-radius)] border border-[var(--border)] bg-[var(--bg-input)] px-6 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-primary)]"
        >
          {t("resetTheme")}
        </button>
      </div>
    </div>
  );
}
