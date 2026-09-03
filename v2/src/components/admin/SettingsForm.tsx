"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import type { Setting } from "@/types/admin";

function parseValue(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : String(parsed);
  } catch {
    return raw;
  }
}

export function SettingsForm({ settings }: { settings: Setting[] }) {
  const t = useTranslations("admin");
  const router = useRouter();

  const [storeName, setStoreName] = useState(
    () => settings.find((s) => s.key === "storeName")?.value
      ? parseValue(settings.find((s) => s.key === "storeName")!.value)
      : ""
  );
  const [phone, setPhone] = useState(
    () => settings.find((s) => s.key === "phone")?.value
      ? parseValue(settings.find((s) => s.key === "phone")!.value)
      : ""
  );
  const [address, setAddress] = useState(
    () => settings.find((s) => s.key === "address")?.value
      ? parseValue(settings.find((s) => s.key === "address")!.value)
      : ""
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const payload = [
      { key: "storeName", value: storeName, category: "general" },
      { key: "phone", value: phone, category: "general" },
      { key: "address", value: address, category: "general" },
    ];

    try {
      const res = await fetch("/api/admin/settings", {
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

      setMessage(t("settingsSaved"));
      router.refresh();
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]";

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl space-y-4 rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]"
    >
      <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
        {t("generalSettings")}
      </h2>

      <div>
        <label
          htmlFor="storeName"
          className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
        >
          {t("storeName")}
        </label>
        <input
          id="storeName"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
        >
          {t("phone")}
        </label>
        <input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="address"
          className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
        >
          {t("address")}
        </label>
        <textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          className={inputClass}
        />
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

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-[var(--btn-radius)] bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {t("saveSettings")}
      </button>
    </form>
  );
}
