"use client";

import { useState, useEffect, useMemo } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MatrixRow {
  id: string;
  wilayaCode: string;
  wilayaName: string;
  homeFee: number;
  stopDeskFee: number;
  estimatedDays: number;
  isActive: boolean;
  wilaya: { code: string; name: string; nameAr: string };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DeliveryMatrixPage() {
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [edited, setEdited] = useState<Record<string, Partial<MatrixRow>>>({});
  const [bulkHomeFee, setBulkHomeFee] = useState("");
  const [bulkStopDeskFee, setBulkStopDeskFee] = useState("");
  const [bulkDays, setBulkDays] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  /* --- Chargement initial --- */
  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/delivery/matrix");
      if (res.ok) {
        setMatrix(await res.json());
      } else {
        setLoadError("Erreur lors du chargement de la matrice de livraison");
      }
    } catch (err) {
      console.error("Erreur chargement matrice:", err);
      setLoadError("Erreur réseau lors du chargement de la matrice de livraison");
    } finally {
      setLoading(false);
    }
  };

  /* --- Filtrage par recherche --- */
  const filtered = useMemo(() => {
    if (!search) return matrix;
    const q = search.toLowerCase();
    return matrix.filter(
      (r) =>
        r.wilayaCode.includes(q) ||
        r.wilaya.name.toLowerCase().includes(q) ||
        r.wilaya.nameAr.includes(q)
    );
  }, [matrix, search]);

  const editedCount = Object.keys(edited).length;

  /* --- Helpers --- */
  const updateField = (code: string, field: keyof MatrixRow, value: unknown) => {
    setEdited((prev) => ({
      ...prev,
      [code]: { ...prev[code], [field]: value },
    }));
  };

  const getFieldValue = <K extends keyof MatrixRow>(row: MatrixRow, field: K): MatrixRow[K] => {
    const patch = edited[row.wilayaCode];
    if (patch && field in patch) {
      return patch[field] as MatrixRow[K];
    }
    return row[field];
  };

  const hasChanges = (code: string): boolean => {
    const patch = edited[code];
    if (!patch) return false;
    // Vérifier qu'au moins une valeur diffère de la ligne originale
    const original = matrix.find((r) => r.wilayaCode === code);
    if (!original) return false;
    return Object.entries(patch).some(([k, v]) => {
      if (v === undefined) return false;
      const origVal = (original as unknown as Record<string, unknown>)[k];
      return origVal !== v;
    });
  };

  /* --- Application en masse --- */
  const handleBulkApply = () => {
    if (!editedCount) return;

    const updates: Record<string, unknown> = {};
    if (bulkHomeFee) updates.homeFee = parseFloat(bulkHomeFee);
    if (bulkStopDeskFee) updates.stopDeskFee = parseFloat(bulkStopDeskFee);
    if (bulkDays) updates.estimatedDays = parseInt(bulkDays, 10);

    if (Object.keys(updates).length === 0) return;

    setEdited((prev) => {
      const next = { ...prev };
      for (const code of Object.keys(next)) {
        next[code] = { ...next[code], ...updates };
      }
      return next;
    });
  };

  /* --- Sauvegarde --- */
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updates = Object.entries(edited)
        .filter(([, data]) => data !== undefined)
        .map(([wilayaCode, data]) => ({
          wilayaCode,
          homeFee: data.homeFee ?? undefined,
          stopDeskFee: data.stopDeskFee ?? undefined,
          estimatedDays: data.estimatedDays ?? undefined,
          isActive: data.isActive ?? undefined,
        }));

      const res = await fetch("/api/delivery/matrix", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ type: "success", message: `${result.updated} wilaya(s) mise(s) à jour` });
        setEdited({});
        setBulkHomeFee("");
        setBulkStopDeskFee("");
        setBulkDays("");
        await fetchMatrix();
      } else {
        setMessage({
          type: "error",
          message: result.error || "Erreur lors de la sauvegarde",
        });
      }
    } catch {
      setMessage({ type: "error", message: "Erreur réseau" });
    } finally {
      setSaving(false);
    }
  };

  /* --- Annulation --- */
  const handleDiscard = () => {
    setEdited({});
    setBulkHomeFee("");
    setBulkStopDeskFee("");
    setBulkDays("");
    setMessage(null);
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Matrice de Livraison</h1>
          <p className="text-sm text-[var(--text-muted)]">
            69 Wilayas — Tarifs et délais de livraison
          </p>
        </div>
        <div className="flex items-center gap-3">
          {editedCount > 0 && (
            <Badge variant="warning">{editedCount} modification(s) en cours</Badge>
          )}
          {editedCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleDiscard}>
              Annuler
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || editedCount === 0}>
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && <Alert type={message.type} message={message.message} />}

      {/* Erreur de chargement */}
      {loadError && <Alert type="error" message={loadError} />}

      {/* Édition en masse — affichée uniquement quand il y a des modifications */}
      {editedCount > 0 && (
        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                Frais domicile (DA)
              </label>
              <Input
                type="number"
                value={bulkHomeFee}
                onChange={(e) => setBulkHomeFee(e.target.value)}
                placeholder="Ex: 600"
                aria-label="Frais domicile en masse (DA)"
                className="w-full sm:w-32"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                Frais Stop Desk (DA)
              </label>
              <Input
                type="number"
                value={bulkStopDeskFee}
                onChange={(e) => setBulkStopDeskFee(e.target.value)}
                placeholder="Ex: 400"
                aria-label="Frais stop desk en masse (DA)"
                className="w-full sm:w-32"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                Délai (jours)
              </label>
              <Input
                type="number"
                value={bulkDays}
                onChange={(e) => setBulkDays(e.target.value)}
                placeholder="Ex: 3"
                aria-label="Délai en masse (jours)"
                className="w-full sm:w-24"
              />
            </div>
            <Button variant="secondary" size="sm" onClick={handleBulkApply}>
              Appliquer aux sélectionnées
            </Button>
          </div>
        </Card>
      )}

      {/* Recherche */}
      <div className="max-w-md">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une wilaya (code ou nom)..."
        />
      </div>

      {/* Tableau de la matrice */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">Code</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)]">
                    Wilaya
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--text-muted)]">
                    Frais Domicile (DA)
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--text-muted)]">
                    Frais Stop Desk (DA)
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-[var(--text-muted)]">
                    Délai (jours)
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-[var(--text-muted)]">
                    Actif
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((row) => {
                  const isEdited = hasChanges(row.wilayaCode);
                  return (
                    <tr
                      key={row.wilayaCode}
                      className={cn(
                        isEdited && "bg-[var(--accent)]/[0.04]",
                        "transition-all duration-300 hover:bg-[var(--bg-secondary)]/50"
                      )}
                    >
                      {/* Code */}
                      <td className="px-4 py-2 font-mono text-xs font-medium text-[var(--text-primary)]">
                        {row.wilayaCode}
                      </td>

                      {/* Nom */}
                      <td className="px-4 py-2">
                        <p className="font-medium text-[var(--text-primary)]">{row.wilaya.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{row.wilaya.nameAr}</p>
                      </td>

                      {/* Frais domicile */}
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          value={getFieldValue(row, "homeFee")}
                          onChange={(e) =>
                            updateField(row.wilayaCode, "homeFee", parseFloat(e.target.value) || 0)
                          }
                          aria-label={`Frais domicile pour ${row.wilaya.name}`}
                          className="w-24 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1.5 text-right text-sm text-[var(--text-primary)] transition-all duration-300 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
                        />
                      </td>

                      {/* Frais stop desk */}
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          value={getFieldValue(row, "stopDeskFee")}
                          onChange={(e) =>
                            updateField(
                              row.wilayaCode,
                              "stopDeskFee",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          aria-label={`Frais stop desk pour ${row.wilaya.name}`}
                          className="w-24 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1.5 text-right text-sm text-[var(--text-primary)] transition-all duration-300 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
                        />
                      </td>

                      {/* Délai */}
                      <td className="px-4 py-2 text-center">
                        <input
                          type="number"
                          value={getFieldValue(row, "estimatedDays")}
                          onChange={(e) =>
                            updateField(
                              row.wilayaCode,
                              "estimatedDays",
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          aria-label={`Délai de livraison pour ${row.wilaya.name}`}
                          className="w-16 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1.5 text-center text-sm text-[var(--text-primary)] transition-all duration-300 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
                        />
                      </td>

                      {/* Toggle actif */}
                      <td className="px-4 py-2 text-center">
                        <ToggleSwitch
                          checked={getFieldValue(row, "isActive")}
                          onChange={() =>
                            updateField(row.wilayaCode, "isActive", !getFieldValue(row, "isActive"))
                          }
                          label={getFieldValue(row, "isActive") ? "Désactiver" : "Activer"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-[var(--text-muted)]">
                Aucune wilaya trouvée pour « {search} »
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Footer info */}
      <p className="text-xs text-[var(--text-muted)]">
        {filtered.length} wilaya(s) affichée(s) sur {matrix.length}
        {editedCount > 0 && ` — ${editedCount} modification(s) non sauvegardée(s)`}
      </p>
    </div>
  );
}
