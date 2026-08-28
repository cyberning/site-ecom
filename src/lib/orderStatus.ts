/**
 * Statuts de commande partagés du dashboard admin.
 * Source unique de vérité pour les libellés, couleurs de badge et options de sélection.
 */

export const ORDER_STATUSES = [
  "PENDING",
  "NEEDS_CONFIRMATION",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  NEEDS_CONFIRMATION: "À confirmer",
  CONFIRMED: "Confirmée",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  RETURNED: "Retournée",
};

/** Couleurs { bg, text } pour les badges personnalisés (dashboard). */
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-yellow-500/15", text: "text-yellow-500" },
  NEEDS_CONFIRMATION: { bg: "bg-orange-500/15", text: "text-orange-500" },
  CONFIRMED: { bg: "bg-blue-500/15", text: "text-blue-500" },
  SHIPPED: { bg: "bg-purple-500/15", text: "text-purple-500" },
  DELIVERED: { bg: "bg-green-500/15", text: "text-green-500" },
  CANCELLED: { bg: "bg-red-500/15", text: "text-red-500" },
  RETURNED: { bg: "bg-gray-500/15", text: "text-gray-500" },
};

/** Variant du composant Badge pour chaque statut. */
export const STATUS_BADGE_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "danger" | "info"
> = {
  PENDING: "warning",
  NEEDS_CONFIRMATION: "info",
  CONFIRMED: "info",
  SHIPPED: "success",
  DELIVERED: "success",
  CANCELLED: "danger",
  RETURNED: "danger",
};

/** Options { value, label } pour les selects de statut. */
export const STATUS_OPTIONS = ORDER_STATUSES.map((status) => ({
  value: status,
  label: STATUS_LABELS[status],
}));
