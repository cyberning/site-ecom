/**
 * Helpers de formatage de dates partagés du dashboard admin.
 */

/** Format complet : JJ/MM/AAAA HH:MM (ex: 28/08/2026 14:30). */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format court pour les graphiques : JJ/MM (ex: 28/08). */
export function formatDateChart(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
