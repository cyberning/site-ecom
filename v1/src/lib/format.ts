/**
 * Helpers de formatage de dates partagés du dashboard admin.
 *
 * CHANGEMENT DE SIGNATURE (adaptation i18n) :
 * Chaque fonction accepte désormais un paramètre `locale` optionnel
 * (défaut : "fr-DZ" pour préserver le comportement actuel). Les composants
 * peuvent passer la locale active (ex: `useLocale()` de next-intl) pour
 * produire un formatage localisé.
 */

/** Format complet : JJ/MM/AAAA HH:MM (ex: 28/08/2026 14:30). */
export function formatDate(dateStr: string, locale: string = "fr-DZ"): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format court pour les graphiques : JJ/MM (ex: 28/08). */
export function formatDateChart(dateStr: string, locale: string = "fr-DZ"): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
}
