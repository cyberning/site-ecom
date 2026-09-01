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

/**
 * Clé de traduction (namespace `status.*`) pour chaque statut.
 * IMPORTANT: aucune valeur ne porte le préfixe `admin.` car tous les appelants
 * passent un `t` déjà namespacé `admin` (via `useTranslations("admin")`).
 * Les composants doivent résoudre l'affichage via `getStatusLabel(status, t)`.
 */
export const STATUS_LABELS: Record<string, string> = {
  PENDING: "status.pending",
  NEEDS_CONFIRMATION: "status.toConfirm",
  CONFIRMED: "status.confirmed",
  SHIPPED: "status.shipped",
  DELIVERED: "status.delivered",
  CANCELLED: "status.cancelled",
  RETURNED: "status.returned",
};

/**
 * Résout le libellé traduit d'un statut.
 * @param status Le statut brut (ex: "PENDING").
 * @param t      La fonction de traduction (ex: `t` de next-intl).
 * @returns Le libellé traduit, ou le statut brut si la traduction est absente.
 */
export function getStatusLabel(status: OrderStatus, t: (key: string) => string): string {
  const key = STATUS_LABELS[status] || `status.${status.toLowerCase()}`;
  const label = t(key);
  // Si next-intl retourne la clé brute (message manquant), on garde le statut brut.
  // `admin.${key}` couvre le cas d'un `t` non namespacé (racine) avec des clés `status.*`.
  if (label === key || label === `admin.${key}`) return status;
  return label;
}

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

/**
 * Options { value, labelKey, label } pour les selects de statut.
 * - `labelKey` : clé du namespace `status.*` (sans préfixe `admin.`), à utiliser
 *   via `t(option.labelKey)` — `t` étant le namespace `admin`.
 * - `label`    : conservé pour compatibilité (contient la clé brute). Les composants
 *   existants qui affichent `option.label` montreront la clé tant qu'ils n'utilisent
 *   pas `t(option.labelKey)`.
 */
export const STATUS_OPTIONS = ORDER_STATUSES.map((status) => ({
  value: status,
  labelKey: STATUS_LABELS[status],
  label: STATUS_LABELS[status],
}));
