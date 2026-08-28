"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";

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
  const [message, setMessage] = useState("");

  const fetchPixels = async () => {
    try {
      const res = await fetch("/api/admin/pixels");
      const data = await res.json();
      setPixels(data.pixels || []);
      setProviders(data.availableProviders || []);
    } catch {
      setMessage("❌ Erreur lors du chargement");
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
    setMessage("");

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
        setMessage("✅ Pixel ajouté avec succès");
        setShowAdd(false);
        setForm({ provider: "META", pixelId: "", name: "", accessToken: "" });
        fetchPixels();
      } else {
        const data = await res.json();
        setMessage(`❌ ${data.error}`);
      }
    } catch {
      setMessage("❌ Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle actif / inactif ──────────────────────────────────────

  const toggleActive = async (pixel: Pixel) => {
    await fetch("/api/admin/pixels", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pixel.id, isActive: !pixel.isActive }),
    });
    fetchPixels();
  };

  // ── Suppression ─────────────────────────────────────────────────

  const deletePixel = async (id: string) => {
    if (!confirm("Supprimer ce pixel ?")) return;
    await fetch(`/api/admin/pixels?id=${id}`, { method: "DELETE" });
    fetchPixels();
  };

  // ── Test (log serveur) ──────────────────────────────────────────

  const testFire = (pixel: Pixel) => {
    setMessage(
      `🧪 Test envoyé pour ${pixel.name} (${pixel.pixelId}) — vérifiez la console serveur`
    );
  };

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tracking Pixels</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Gérez vos pixels de conversion serveur-side (CAPI / Events API)
          </p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Annuler" : "+ Ajouter un pixel"}
        </Button>
      </div>

      {/* Message flash */}
      {message && (
        <div
          className={`rounded-[var(--radius-sm)] p-3 text-sm ${
            message.startsWith("✅")
              ? "bg-green-500/10 text-green-600"
              : message.startsWith("🧪")
                ? "bg-blue-500/10 text-blue-600"
                : "bg-red-500/10 text-red-500"
          }`}
        >
          {message}
          <button onClick={() => setMessage("")} className="ml-2 text-[var(--text-muted)]">
            ✕
          </button>
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showAdd && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-[var(--text-primary)]">Ajouter un pixel</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            {/* Choix du provider */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                Provider
              </label>
              <div className="flex flex-wrap gap-3">
                {providers.map((p) => (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, provider: p.code }))}
                    className={`rounded-[var(--radius-sm)] border px-4 py-2 text-sm transition-[var(--transition)] ${
                      form.provider === p.code
                        ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                        : "border-[var(--border)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-1 text-xs text-[var(--text-muted)]">— {p.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nom */}
            <Input
              label="Nom (optionnel)"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Pixel principal Meta"
            />

            {/* Pixel ID */}
            <Input
              label="Pixel ID / Conversion Label"
              value={form.pixelId}
              onChange={(e) => setForm((f) => ({ ...f, pixelId: e.target.value }))}
              required
              placeholder="Ex: 123456789 ou AW-XXXXXXXXX"
            />

            {/* Access Token */}
            <Input
              label="Access Token (optionnel)"
              value={form.accessToken}
              onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))}
              placeholder="Token API pour le tracking serveur"
              type="password"
            />

            <Button type="submit" disabled={saving}>
              {saving ? "Ajout..." : "Ajouter le pixel"}
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
          <p className="mb-4 text-4xl">📊</p>
          <p className="text-lg font-medium text-[var(--text-primary)]">Aucun pixel configuré</p>
          <p className="mt-2 text-sm">
            Ajoutez un pixel Meta, TikTok ou Google pour tracker vos conversions serveur-side.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pixels.map((pixel) => (
            <Card key={pixel.id} className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <Badge variant={PROVIDER_BADGE[pixel.type] || "default"}>{pixel.type}</Badge>
                <button
                  onClick={() => toggleActive(pixel)}
                  className={`inline-flex h-6 w-11 items-center rounded-full transition-[var(--transition)] ${
                    pixel.isActive ? "bg-green-500" : "bg-[var(--text-muted)]"
                  }`}
                  title={pixel.isActive ? "Désactiver" : "Activer"}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      pixel.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <p className="mb-1 text-sm font-medium text-[var(--text-primary)]">{pixel.name}</p>
              <p className="mb-3 font-mono text-xs text-[var(--text-muted)]">{pixel.pixelId}</p>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => testFire(pixel)}>
                  Tester
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deletePixel(pixel.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  Supprimer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
