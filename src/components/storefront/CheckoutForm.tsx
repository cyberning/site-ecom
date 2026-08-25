"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useWilaya } from "@/hooks/useWilaya";
import { useDelivery } from "@/hooks/useDelivery";

interface CheckoutFormProps {
  productId: string;
  productName: string;
  variants: { id: string; name: string; price: number; isActive: boolean }[];
  basePrice: number;
}

export default function CheckoutForm({ productName, variants, basePrice }: CheckoutFormProps) {
  const router = useRouter();

  // Form state
  const [selectedVariant, setSelectedVariant] = useState(
    variants.find((v) => v.isActive)?.id || ""
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"HOME" | "STOP_DESK">("HOME");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Hooks
  const { wilayas, communes, selectedWilaya, setSelectedWilaya, loadingCommunes } = useWilaya();
  const [selectedCommune, setSelectedCommune] = useState("");
  const { fee: deliveryFee, loading: deliveryLoading } = useDelivery(selectedWilaya, deliveryMode);

  // Calculs
  const activeVariant = variants.find((v) => v.id === selectedVariant);
  const variantPrice = activeVariant ? Number(activeVariant.price) : basePrice;
  const subtotal = variantPrice * quantity;
  const total = subtotal + deliveryFee;

  const formatPrice = (p: number) => new Intl.NumberFormat("fr-DZ").format(p) + " DA";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation téléphone
    if (!/^0(5|6|7)[0-9]{8}$/.test(customerPhone)) {
      setError("Le numéro doit commencer par 05, 06 ou 07 et contenir 10 chiffres");
      return;
    }
    if (!selectedWilaya || !selectedCommune) {
      setError("Veuillez sélectionner une wilaya et une commune");
      return;
    }
    if (!selectedVariant) {
      setError("Veuillez sélectionner une variante");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          wilayaCode: selectedWilaya,
          communeCode: selectedCommune,
          fullAddress,
          deliveryMode,
          variantId: selectedVariant,
          quantity,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la commande");
        return;
      }

      router.push(`/thank-you?tracking=${data.trackingId}`);
    } catch {
      setError("Erreur lors de la commande. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-neumorphic)]">
      <h3 className="mb-6 text-xl font-bold text-[var(--text-primary)]">
        Commander — {productName}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-[var(--radius-sm)] bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Sélecteur de variante */}
        {variants.length > 1 && (
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Variante
            </label>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => v.isActive && setSelectedVariant(v.id)}
                  disabled={!v.isActive}
                  className={`rounded-[var(--radius-sm)] border px-3 py-2 text-sm transition-[var(--transition)] ${
                    selectedVariant === v.id
                      ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                      : v.isActive
                        ? "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                        : "cursor-not-allowed border-[var(--border)] text-[var(--text-muted)] opacity-50"
                  }`}
                >
                  {v.name} — {formatPrice(Number(v.price))}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Coordonnées */}
        <Input
          label="Nom complet *"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
          placeholder="Mohamed Benali"
        />
        <Input
          label="Téléphone *"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          required
          placeholder="0XXXXXXXXX"
        />
        <Input
          label="Adresse complète *"
          value={fullAddress}
          onChange={(e) => setFullAddress(e.target.value)}
          required
          placeholder="Rue, numéro, étage, etc."
        />

        {/* Cascade Wilaya → Commune */}
        <Select
          label="Wilaya *"
          value={selectedWilaya}
          onChange={(e) => {
            setSelectedWilaya(e.target.value);
            setSelectedCommune("");
          }}
          options={wilayas.map((w) => ({
            value: w.code,
            label: `${w.code} - ${w.name}`,
          }))}
          placeholder="Sélectionner une wilaya"
        />
        <Select
          label="Commune *"
          value={selectedCommune}
          onChange={(e) => setSelectedCommune(e.target.value)}
          options={communes.map((c) => ({ value: c.code, label: c.name }))}
          placeholder={loadingCommunes ? "Chargement..." : "Sélectionner une commune"}
          disabled={!selectedWilaya || loadingCommunes}
        />

        {/* Mode de livraison */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            Mode de livraison
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDeliveryMode("HOME")}
              className={`rounded-[var(--radius-md)] border-2 p-4 text-center transition-[var(--transition)] ${
                deliveryMode === "HOME"
                  ? "border-[var(--accent)] bg-[var(--accent-light)]"
                  : "border-[var(--border)] hover:border-[var(--accent)]"
              }`}
            >
              <span className="block text-2xl">🏠</span>
              <span className="mt-1 block text-sm font-medium text-[var(--text-primary)]">
                Domicile
              </span>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMode("STOP_DESK")}
              className={`rounded-[var(--radius-md)] border-2 p-4 text-center transition-[var(--transition)] ${
                deliveryMode === "STOP_DESK"
                  ? "border-[var(--accent)] bg-[var(--accent-light)]"
                  : "border-[var(--border)] hover:border-[var(--accent)]"
              }`}
            >
              <span className="block text-2xl">📦</span>
              <span className="mt-1 block text-sm font-medium text-[var(--text-primary)]">
                Stop Desk
              </span>
            </button>
          </div>
        </div>

        {/* Quantité */}
        <Input
          label="Quantité"
          type="number"
          value={String(quantity)}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          min="1"
        />

        {/* Résumé commande */}
        <div className="space-y-2 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] p-4">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Prix unitaire</span>
            <span className="text-[var(--text-primary)]">{formatPrice(variantPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Quantité</span>
            <span className="text-[var(--text-primary)]">×{quantity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Sous-total</span>
            <span className="text-[var(--text-primary)]">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Livraison</span>
            <span className="text-[var(--text-primary)]">
              {deliveryLoading ? "..." : formatPrice(deliveryFee)}
            </span>
          </div>
          <div className="flex justify-between border-t border-[var(--border)] pt-2 font-bold">
            <span className="text-[var(--text-primary)]">Total</span>
            <span className="text-[var(--accent)]">{formatPrice(total)}</span>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Envoi en cours..." : `Confirmer la commande — ${formatPrice(total)}`}
        </Button>

        <p className="text-center text-xs text-[var(--text-muted)]">
          💵 Paiement à la livraison — Inspection avant paiement
        </p>
      </form>
    </div>
  );
}
