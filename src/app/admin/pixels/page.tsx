"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { BarChart3 } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import Modal from "@/components/ui/Modal";

// ─── Types ──────────────────────────────────────────────────────────

interface Pixel {
  id: string;
  name: string;
  type: string;
  pixelId: string;
  isActive: boolean;
  isGlobal: boolean;
  createdAt: string;
}

interface ProviderInfo {
  code: string;
  name: string;
  description: string;
}

const PROVIDER_BADGE: Record<string, "info" | "warning" | "success"> = {
  META: "info",
  TIKTOK: "warning",
  GOOGLE: "success",
};

// ─── Page ───────────────────────────────────────────────────────────

export default function AdminPixels() {
  const t = useTranslations("admin");
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    provider: "META",
    pixelId: "",
    name: "",
    accessToken: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const fetchPixels = async () => {
    try {
      const res = await fetch("/api/admin/pixels");
      const data = await res.json();
      setPixels(data.pixels || []);
      setProviders(data.availableProviders || []);
    } catch {
      setMessage({ type: "error", message: t("pixelsPage.loadError") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPixels();
  }, []);

  // ── Création ────────────────────────────────────────────────────

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/pixels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.provider,
          pixelId: form.pixelId,
          name: form.name || undefined,
          accessToken: form.accessToken || undefined,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", message: t("pixelsPage.added") });
        setShowAdd(false);
        setForm({ provider: "META", pixelId: "", name: "", accessToken: "" });
        fetchPixels();
      } else {
        const data = await res.json();
        setMessage({ type: "error", message: data.error });
      }
    } catch {
      setMessage({ type: "error", message: t("pixelsPage.networkError") });
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle actif / inactif ──────────────────────────────────────

  const toggleActive = async (pixel: Pixel) => {
    try {
      const res = await fetch("/api/admin/pixels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pixel.id, isActive: !pixel.isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage({
          type: "error",
          message: data.error || t("pixelsPage.updateError"),
        });
        return;
      }
      fetchPixels();
    } catch {
      setMessage({ type: "error", message: t("pixelsPage.updateNetworkError") });
    }
  };

  // ── Suppression ─────────────────────────────────────────────────

  const deletePixel = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/pixels?id=${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setMessage({
          type: "error",
          message: data.error || t("pixelsPage.deleteError"),
        });
        return;
      }
      setDeleteId(null);
      fetchPixels();
    } catch {
      setMessage({ type: "error", message: t("pixelsPage.deleteNetworkError") });
    }
  };

  // ── Test (log serveur) ──────────────────────────────────────────

  const testFire = (pixel: Pixel) => {
    setMessage({
      type: "info",
      message: t("pixelsPage.testSent", { name: pixel.name, pixelId: pixel.pixelId }),
    });
  };

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t("pixelsPage.title")}</h1>
          <p className="text-sm text-[var(--text-muted)]">{t("pixelsPage.subtitle")}</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? t("pixelsPage.cancel") : t("pixelsPage.addPixel")}
        </Button>
      </div>

      {/* Message flash */}
      {message && (
        <Alert type={message.type} message={message.message} onDismiss={() => setMessage(null)} />
      )}

      {/* Formulaire d'ajout */}
      {showAdd && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-[var(--text-primary)]">
            {t("pixelsPage.formTitle")}
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            {/* Choix du provider */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                {t("pixelsPage.provider")}
              </label>
              <div className="flex flex-wrap gap-3">
                {providers.map((p) => (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, provider: p.code }))}
                    aria-pressed={form.provider === p.code}
                    className={`rounded-[var(--radius-sm)] border px-4 py-2 text-sm transition-all duration-300 ${
                      form.provider === p.code
                        ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                        : "border-[var(--border)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-1 text-xs text-[var(--text-muted)]">
                      {t("pixelsPage.providerDesc", { description: p.description })}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nom */}
            <Input
              label={t("pixelsPage.nameOptional")}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t("pixelsPage.namePlaceholder")}
            />

            {/* Pixel ID */}
            <Input
              label={t("pixelsPage.pixelId")}
              value={form.pixelId}
              onChange={(e) => setForm((f) => ({ ...f, pixelId: e.target.value }))}
              required
              placeholder={t("pixelsPage.pixelIdPlaceholder")}
            />

            {/* Access Token */}
            <Input
              label={t("pixelsPage.accessToken")}
              value={form.accessToken}
              onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))}
              placeholder={t("pixelsPage.accessTokenPlaceholder")}
              type="password"
            />

            <Button type="submit" disabled={saving}>
              {saving ? t("pixelsPage.adding") : t("pixelsPage.add")}
            </Button>
          </form>
        </Card>
      )}

      {/* Liste des pixels */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : pixels.length === 0 ? (
        <Card className="py-16 text-center text-[var(--text-muted)]">
          <BarChart3
            className="mx-auto mb-4 h-12 w-12 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          <p className="text-lg font-medium text-[var(--text-primary)]">{t("pixelsPage.empty")}</p>
          <p className="mt-2 text-sm">{t("pixelsPage.emptyHint")}</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pixels.map((pixel) => (
            <Card key={pixel.id} className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <Badge variant={PROVIDER_BADGE[pixel.type] || "default"}>{pixel.type}</Badge>
                <ToggleSwitch
                  checked={pixel.isActive}
                  onChange={() => toggleActive(pixel)}
                  label={pixel.isActive ? t("pixelsPage.disable") : t("pixelsPage.enable")}
                />
              </div>

              <p className="mb-1 text-sm font-medium text-[var(--text-primary)]">{pixel.name}</p>
              <p className="mb-3 font-mono text-xs text-[var(--text-muted)]">{pixel.pixelId}</p>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => testFire(pixel)}>
                  {t("pixelsPage.test")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(pixel.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  {t("pixelsPage.delete")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t("pixelsPage.deleteTitle")}
      >
        <p className="mb-6 text-[var(--text-secondary)]">
          {t("pixelsPage.deleteConfirm")} {t("pixelsPage.deleteIrreversible")}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            {t("pixelsPage.cancel")}
          </Button>
          <Button variant="danger" onClick={deletePixel}>
            {t("pixelsPage.delete")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
