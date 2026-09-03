"use client";

import { useState, useEffect, useMemo, useCallback, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  Truck,
  Plug,
  PlugZap,
  Search,
  Trash2,
  Pencil,
  CheckCircle2,
  XCircle,
  Loader2,
  Link2,
  Unplug,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Modal from "@/components/ui/Modal";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Courier {
  key: string;
  name: string;
  platform: string;
  requiredCredentials: string[];
  capabilities: {
    createShipment: boolean;
    cancelShipment: boolean;
    track: boolean;
    rates: boolean;
    [key: string]: boolean;
  };
  endpoint?: string;
  requiresBaseUrl?: boolean;
  baseUrlSuffixes?: string[];
  aliases?: string[];
}

interface Connection {
  code: string;
  name: string;
  platform: string;
  credentials: Record<string, string>; // valeurs TOUJOURS masquées "••••••••"
  baseUrl?: string;
  fromWilaya?: number;
  isActive: boolean;
  createdAt: string;
}

interface ProvidersResponse {
  couriers: Courier[];
  connections: Connection[];
  couriersError?: string;
}

interface ModalState {
  open: boolean;
  courier: Courier | null;
  existing: Connection | null; // non-null en mode modification
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const MASK = "••••••••";

/** Normalise une chaîne pour la recherche (minuscules, sans accents). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DeliveryConnectionPage() {
  const t = useTranslations("admin");

  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [couriersError, setCouriersError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  // Modal de connexion
  const [modal, setModal] = useState<ModalState>({ open: false, courier: null, existing: null });
  const [form, setForm] = useState<Record<string, string>>({});
  const [baseUrl, setBaseUrl] = useState("");
  const [fromWilaya, setFromWilaya] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  // Erreur de validation du formulaire (credentials requis manquants)
  const [formError, setFormError] = useState<string | null>(null);

  // Modal de déconnexion
  const [disconnectCode, setDisconnectCode] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  // Message flash global
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  /* --- Chargement initial --- */
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/delivery/providers");
      if (!res.ok) {
        setLoadError(t("deliveryPage.loadError"));
        return;
      }
      const data: ProvidersResponse = await res.json();
      setCouriers(data.couriers || []);
      setConnections(data.connections || []);
      setCouriersError(data.couriersError ?? null);
    } catch {
      setLoadError(t("deliveryPage.networkError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  /* --- Recherche de transporteurs disponibles --- */
  const filteredCouriers = useMemo(() => {
    if (!search) return couriers;
    const q = normalize(search);
    return couriers.filter((c) => {
      const haystack = normalize([c.name, c.platform, c.key, ...(c.aliases ?? [])].join(" "));
      return haystack.includes(q);
    });
  }, [couriers, search]);

  /* --- Groupement par plateforme --- */
  const groupedByPlatform = useMemo(() => {
    const groups = new Map<string, Courier[]>();
    for (const c of filteredCouriers) {
      const key = c.platform || "—";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }
    return Array.from(groups.entries());
  }, [filteredCouriers]);

  const connectedCodes = useMemo(() => new Set(connections.map((c) => c.code)), [connections]);

  /* --- Ouverture du modal (connexion nouvelle ou modification) --- */
  const openConnectModal = (courier: Courier, existing: Connection | null) => {
    // En mode modification, les credentials sont masqués côté API : on exige la
    // ressaisie complète pour tester ou mettre à jour (voir reenterCredentials).
    const initial: Record<string, string> = {};
    for (const key of courier.requiredCredentials) initial[key] = "";
    setForm(initial);
    setBaseUrl(existing?.baseUrl ?? "");
    setFromWilaya(existing?.fromWilaya != null ? String(existing.fromWilaya) : "");
    setTestResult(null);
    setFormError(null);
    setModal({ open: true, courier, existing });
  };

  const closeModal = () => {
    setModal({ open: false, courier: null, existing: null });
    setTestResult(null);
    setFormError(null);
  };

  /* --- Test de connexion (POST /test, ne sauvegarde rien) --- */
  const handleTest = async () => {
    if (!modal.courier) return;
    setTesting(true);
    setTestResult(null);
    setFormError(null);
    try {
      const res = await fetch("/api/delivery/providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: modal.courier.key,
          credentials: form,
          ...(baseUrl ? { baseUrl } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ type: "success", message: t("deliveryPage.testSuccess") });
      } else {
        setTestResult({
          type: "error",
          message: t("deliveryPage.testError", { error: data.error || "—" }),
        });
      }
    } catch {
      setTestResult({ type: "error", message: t("deliveryPage.testError", { error: "—" }) });
    } finally {
      setTesting(false);
    }
  };

  /* --- Enregistrement (POST) --- */
  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!modal.courier) return;

    // C1 — Validation stricte (option A) : tous les credentials requis doivent être
    // remplis. En mode modification, l'API écrase l'objet credentials entier :
    // envoyer une chaîne vide écraserait silencieusement les vrais identifiants.
    const missing = modal.courier.requiredCredentials.some((key) => !form[key]?.trim());
    if (missing) {
      setFormError(t("deliveryPage.requiredField"));
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/delivery/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: modal.courier.key,
          name: modal.courier.name,
          platform: modal.courier.platform,
          credentials: form,
          ...(baseUrl ? { baseUrl } : {}),
          ...(fromWilaya ? { fromWilaya: parseInt(fromWilaya, 10) } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          message: modal.existing
            ? t("deliveryPage.updateSuccess")
            : t("deliveryPage.connectedSuccess"),
        });
        closeModal();
        await fetchProviders();
      } else {
        setMessage({ type: "error", message: data.error || t("deliveryPage.loadError") });
      }
    } catch {
      setMessage({ type: "error", message: t("deliveryPage.networkError") });
    } finally {
      setSaving(false);
    }
  };

  /* --- Déconnexion (DELETE) --- */
  const handleDisconnect = async () => {
    if (!disconnectCode) return;
    setDisconnecting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/delivery/providers/${disconnectCode}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", message: t("deliveryPage.disconnectedSuccess") });
        setDisconnectCode(null);
        await fetchProviders();
      } else {
        const data = await res.json();
        setMessage({ type: "error", message: data.error || t("deliveryPage.loadError") });
      }
    } catch {
      setMessage({ type: "error", message: t("deliveryPage.networkError") });
    } finally {
      setDisconnecting(false);
    }
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t("deliveryPage.title")}</h1>
        <p className="text-sm text-[var(--text-muted)]">{t("deliveryPage.subtitle")}</p>
      </div>

      {/* Message flash */}
      {message && (
        <Alert type={message.type} message={message.message} onDismiss={() => setMessage(null)} />
      )}

      {/* Erreur de chargement */}
      {loadError && <Alert type="error" message={loadError} />}

      {/* Avertissement couriers indisponibles */}
      {couriersError && <Alert type="info" message={t("deliveryPage.couriersError")} />}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* ========================================================== */}
          {/*  Transporteurs connectés                                   */}
          {/* ========================================================== */}
          <section aria-labelledby="connected-heading">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2
                  id="connected-heading"
                  className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]"
                >
                  <Plug className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                  {t("deliveryPage.connectedSection")}
                </h2>
                <p className="text-sm text-[var(--text-muted)]">
                  {t("deliveryPage.connectedSectionHint")}
                </p>
              </div>
              {connections.length > 0 && (
                <Badge variant="success">
                  {t("deliveryPage.connectedCount", { count: connections.length })}
                </Badge>
              )}
            </div>

            {connections.length === 0 ? (
              <Card className="py-12 text-center text-[var(--text-muted)]">
                <Unplug
                  className="mx-auto mb-4 h-12 w-12 text-[var(--text-muted)]"
                  aria-hidden="true"
                />
                <p className="text-lg font-medium text-[var(--text-primary)]">
                  {t("deliveryPage.emptyConnected")}
                </p>
                <p className="mt-2 text-sm">{t("deliveryPage.emptyConnectedHint")}</p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {connections.map((conn) => {
                  const courier = couriers.find((c) => c.key === conn.code);
                  return (
                    <Card key={conn.code} className="flex flex-col p-5">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Truck className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                          <p className="font-semibold text-[var(--text-primary)]">{conn.name}</p>
                        </div>
                        <Badge variant="success">{t("deliveryPage.connected")}</Badge>
                      </div>

                      <Badge variant="info" className="mb-3 self-start">
                        {conn.platform}
                      </Badge>

                      {/* Credentials masqués */}
                      <div className="mb-4 space-y-1.5">
                        <p className="text-xs font-medium tracking-wide text-[var(--text-muted)] uppercase">
                          {t("deliveryPage.credentials")}
                        </p>
                        {Object.keys(conn.credentials).map((key) => (
                          <div
                            key={key}
                            className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5"
                          >
                            <span className="font-mono text-xs text-[var(--text-muted)]">
                              {key}
                            </span>
                            <span className="font-mono text-xs text-[var(--text-primary)]">
                              {MASK}
                            </span>
                          </div>
                        ))}
                        {conn.baseUrl && (
                          <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5">
                            <span className="font-mono text-xs text-[var(--text-muted)]">
                              {t("deliveryPage.baseUrl")}
                            </span>
                            <span className="truncate pl-2 font-mono text-xs text-[var(--text-primary)]">
                              {conn.baseUrl}
                            </span>
                          </div>
                        )}
                        {conn.fromWilaya != null && (
                          <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5">
                            <span className="font-mono text-xs text-[var(--text-muted)]">
                              {t("deliveryPage.fromWilaya")}
                            </span>
                            <span className="font-mono text-xs text-[var(--text-primary)]">
                              {conn.fromWilaya}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-auto flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => courier && openConnectModal(courier, conn)}
                          aria-label={`${t("deliveryPage.edit")} ${conn.name}`}
                        >
                          <Pencil className="ms-1.5 h-4 w-4" aria-hidden="true" />
                          {t("deliveryPage.edit")}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDisconnectCode(conn.code)}
                          aria-label={`${t("deliveryPage.disconnect")} ${conn.name}`}
                        >
                          <Trash2 className="ms-1.5 h-4 w-4" aria-hidden="true" />
                          {t("deliveryPage.disconnect")}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* ========================================================== */}
          {/*  Transporteurs disponibles                                  */}
          {/* ========================================================== */}
          <section aria-labelledby="available-heading">
            <div className="mb-3">
              <h2
                id="available-heading"
                className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]"
              >
                <PlugZap className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                {t("deliveryPage.availableSection")}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                {t("deliveryPage.availableSectionHint")}
              </p>
            </div>

            {/* Recherche */}
            <div className="relative mb-4 max-w-md">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("deliveryPage.searchPlaceholder")}
                aria-label={t("deliveryPage.searchPlaceholder")}
                className="pl-9"
              />
            </div>

            {couriers.length === 0 ? (
              <Card className="py-12 text-center text-[var(--text-muted)]">
                <Truck
                  className="mx-auto mb-4 h-12 w-12 text-[var(--text-muted)]"
                  aria-hidden="true"
                />
                <p className="text-lg font-medium text-[var(--text-primary)]">
                  {t("deliveryPage.emptyAvailable")}
                </p>
              </Card>
            ) : filteredCouriers.length === 0 ? (
              <Card className="py-12 text-center text-sm text-[var(--text-muted)]">
                {t("deliveryPage.noResults", { search })}
              </Card>
            ) : (
              <div className="space-y-6">
                {groupedByPlatform.map(([platform, list]) => (
                  <div key={platform}>
                    <h3 className="mb-2 text-sm font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                      {platform}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map((courier) => {
                        const isConnected = connectedCodes.has(courier.key);
                        return (
                          <Card key={courier.key} className="flex flex-col p-5">
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <p className="font-semibold text-[var(--text-primary)]">
                                {courier.name}
                              </p>
                              {isConnected ? (
                                <Badge variant="success">{t("deliveryPage.connected")}</Badge>
                              ) : (
                                <Badge variant="default">{t("deliveryPage.notConnected")}</Badge>
                              )}
                            </div>

                            <p className="mb-3 font-mono text-xs text-[var(--text-muted)]">
                              {courier.key}
                            </p>

                            {/* Capacités */}
                            <div className="mb-4 flex flex-wrap gap-1.5">
                              {courier.capabilities.createShipment && (
                                <Badge variant="info">{t("deliveryPage.capCreateShipment")}</Badge>
                              )}
                              {courier.capabilities.track && (
                                <Badge variant="info">{t("deliveryPage.capTrack")}</Badge>
                              )}
                              {courier.capabilities.rates && (
                                <Badge variant="info">{t("deliveryPage.capRates")}</Badge>
                              )}
                            </div>

                            <div className="mt-auto">
                              <Button
                                variant={isConnected ? "secondary" : "primary"}
                                size="sm"
                                onClick={() =>
                                  openConnectModal(
                                    courier,
                                    isConnected
                                      ? (connections.find((c) => c.code === courier.key) ?? null)
                                      : null
                                  )
                                }
                                aria-label={`${isConnected ? t("deliveryPage.edit") : t("deliveryPage.connect")} ${courier.name}`}
                              >
                                <Link2 className="ms-1.5 h-4 w-4" aria-hidden="true" />
                                {isConnected ? t("deliveryPage.edit") : t("deliveryPage.connect")}
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ============================================================ */}
      {/*  Modal de connexion / modification                            */}
      {/* ============================================================ */}
      <Modal
        isOpen={modal.open}
        onClose={closeModal}
        title={modal.existing ? t("deliveryPage.editTitle") : t("deliveryPage.connectTitle")}
      >
        {modal.courier && (
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              <p className="font-semibold text-[var(--text-primary)]">{modal.courier.name}</p>
              <Badge variant="info">{modal.courier.platform}</Badge>
            </div>

            {/* Note en mode modification : les credentials sont masqués côté serveur */}
            {modal.existing && <Alert type="info" message={t("deliveryPage.reenterCredentials")} />}

            {/* Champs credentials dynamiques */}
            <div className="space-y-3">
              <p className="text-xs font-medium tracking-wide text-[var(--text-muted)] uppercase">
                {t("deliveryPage.credentials")}
              </p>
              {modal.courier.requiredCredentials.map((key) => (
                <Input
                  key={key}
                  id={`cred-${key}`}
                  label={key}
                  value={form[key] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={modal.existing ? MASK : key}
                  type="password"
                  autoComplete="off"
                  required
                />
              ))}
            </div>

            {/* baseUrl si requis */}
            {modal.courier.requiresBaseUrl && (
              <Input
                id="base-url"
                label={t("deliveryPage.baseUrl")}
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={t("deliveryPage.baseUrlPlaceholder")}
                autoComplete="off"
              />
            )}

            {/* fromWilaya optionnel */}
            <Input
              id="from-wilaya"
              label={t("deliveryPage.fromWilaya")}
              value={fromWilaya}
              onChange={(e) => setFromWilaya(e.target.value)}
              placeholder={t("deliveryPage.fromWilayaPlaceholder")}
              type="number"
              min={1}
              max={69}
            />

            {/* Résultat du test */}
            {testResult && <Alert type={testResult.type} message={testResult.message} />}

            {/* Erreur de validation (credentials requis manquants) */}
            {formError && <Alert type="error" message={formError} />}

            <p className="text-xs text-[var(--text-muted)]">{t("deliveryPage.testHint")}</p>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button type="button" variant="ghost" size="sm" onClick={closeModal}>
                {t("deliveryPage.cancel")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleTest}
                disabled={testing || saving}
              >
                {testing ? (
                  <>
                    <Loader2 className="ms-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
                    {t("deliveryPage.testing")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="ms-1.5 h-4 w-4" aria-hidden="true" />
                    {t("deliveryPage.test")}
                  </>
                )}
              </Button>
              <Button type="submit" disabled={saving || testing}>
                {saving ? (
                  <>
                    <Loader2 className="ms-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
                    {t("deliveryPage.saving")}
                  </>
                ) : modal.existing ? (
                  t("deliveryPage.edit")
                ) : (
                  t("deliveryPage.connect")
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ============================================================ */}
      {/*  Modal de confirmation de déconnexion                         */}
      {/* ============================================================ */}
      <Modal
        isOpen={!!disconnectCode}
        onClose={() => setDisconnectCode(null)}
        title={t("deliveryPage.disconnectTitle")}
      >
        <p className="mb-6 text-[var(--text-secondary)]">
          {t("deliveryPage.disconnectConfirm")} {t("deliveryPage.disconnectIrreversible")}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDisconnectCode(null)}>
            {t("deliveryPage.cancel")}
          </Button>
          <Button variant="danger" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting ? (
              <>
                <Loader2 className="ms-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
                {t("deliveryPage.disconnect")}
              </>
            ) : (
              <>
                <XCircle className="ms-1.5 h-4 w-4" aria-hidden="true" />
                {t("deliveryPage.disconnect")}
              </>
            )}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
