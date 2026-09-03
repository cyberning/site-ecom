/**
 * Import des wilayas et communes algériennes (69 wilayas / 1 541 communes)
 * depuis le dataset public CC0 du projet dzship (https://github.com/DZBuild-com/dzship).
 *
 * Depuis la Loi 26-06 (2026), l'Algérie compte 69 wilayas : 11 nouvelles wilayas
 * (codes 59-69) ont été créées à partir de 108 communes prélevées sur 10 wilayas
 * existantes. Le fichier communes.json de la source référence encore ces communes
 * sous leur ANCIENNE wilaya : on les réaffecte via communes-moved-2026.csv.
 *
 * Génère prisma/data/wilayas-communes.json au format attendu par prisma/seed.ts.
 * Idempotent : relançable sans effet de bord (tri déterministe, upserts côté seed).
 *
 * Usage : npx tsx scripts/import-wilayas-communes.ts
 */

import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { pathToFileURL } from "url";

const WILAYAS_URL =
  "https://raw.githubusercontent.com/DZBuild-com/dzship/main/data/wilayas-2026.json";
const COMMUNES_URL =
  "https://raw.githubusercontent.com/DZBuild-com/dzship/main/data/communes.json";
const MOVED_CSV_URL =
  "https://raw.githubusercontent.com/DZBuild-com/dzship/main/data/communes-moved-2026.csv";
const OUTPUT_PATH = join(__dirname, "..", "prisma", "data", "wilayas-communes.json");

const NB_WILAYAS_ATTENDUES = 69;
const NB_COMMUNES_ATTENDUES = 1541;
const NB_COMMUNES_DEPLACEES_ATTENDUES = 108;
const FETCH_TIMEOUT_MS = 30_000;

export type SourceWilaya = {
  code: number;
  name: string;
  nameAr: string;
  nameAscii: string;
  communeCount: number;
  courierSupported?: boolean;
  shipAs?: number;
  shipAsName?: string;
};

export type SourceCommune = {
  wilayaCode: number;
  name: string;
  nameAr: string;
};

/** Ligne du CSV communes-moved-2026.csv (6 colonnes, pas de virgule dans les noms). */
export type MovedCommune = {
  name: string;
  nameAr: string;
  oldWilayaCode: number;
  newWilayaCode: number;
  newWilayaName: string;
};

export type CommuneOutput = {
  code: string;
  name: string;
  nameAr: string;
};

export type WilayaOutput = {
  code: string;
  name: string;
  nameAr: string;
  communes: CommuneOutput[];
  /** Métadonnées transporteur (ignorées par le seed, qui ne lit que code/name/nameAr/communes). */
  courierSupported?: boolean;
  shipAs?: number;
  shipAsName?: string;
};

/** Comptes attendus pour les validations de buildDataset (surchargeables en test). */
export type DatasetAttendus = {
  nbWilayas: number;
  nbCommunes: number;
  nbCommunesDeplacees: number;
};

const ATTENDUS_PAR_DEFAUT: DatasetAttendus = {
  nbWilayas: NB_WILAYAS_ATTENDUES,
  nbCommunes: NB_COMMUNES_ATTENDUES,
  nbCommunesDeplacees: NB_COMMUNES_DEPLACEES_ATTENDUES,
};

/** Fetch JSON avec gestion d'erreur HTTP et timeout (AbortController). */
async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} pour ${url}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch texte brut (CSV) avec la même robustesse que fetchJson. */
async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} pour ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Normalisation du nom pour le matching : minuscules, sans accents,
 * apostrophes/tirets remplacés par des espaces, espaces multiples réduits.
 *
 * Limite connue : ne gère pas les parenthèses ni les points (ex. "Sidi Aïssa (ex. ...)").
 * Aucun nom source ne les contient aujourd'hui ; le fail-fast de buildDataset
 * (commune déplacée introuvable) protège contre toute régression de la source.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse le CSV des communes déplacées (header en 1re ligne, séparateur virgule). */
export function parseMovedCsv(csv: string): MovedCommune[] {
  const lignes = csv
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lignes.length === 0) {
    throw new Error("CSV des communes déplacées vide");
  }

  const header = lignes[0];
  const attendu = "commune_name,commune_name_ar,old_wilaya_code,new_wilaya_code,new_wilaya_name,gazette_name";
  if (header !== attendu) {
    throw new Error(`Header CSV inattendu : "${header}"`);
  }

  return lignes.slice(1).map((ligne, index) => {
    const champs = ligne.split(",");
    if (champs.length !== 6) {
      throw new Error(
        `Ligne CSV ${index + 2} invalide (${champs.length} champs au lieu de 6) : "${ligne}"`
      );
    }
    const [name, nameAr, oldWilayaCode, newWilayaCode, newWilayaName] = champs;
    return {
      name,
      nameAr,
      oldWilayaCode: Number(oldWilayaCode),
      newWilayaCode: Number(newWilayaCode),
      newWilayaName,
    };
  });
}

function padCode(code: number): string {
  return String(code).padStart(2, "0");
}

/**
 * Construit le dataset final (WilayaOutput[]) à partir des données source.
 *
 * Fonction pure : aucune I/O réseau ni fichier. Elle enchaîne :
 *   1. réaffectation des communes déplacées (fail-fast si introuvable),
 *   2. validations (nb wilayas/communes, orphelines, communeCount, codes uniques,
 *      codes wilayas dupliqués),
 *   3. tri déterministe (wilayas par code, communes par nom),
 *   4. génération des codes positionnels (préfixe wilaya + index).
 *
 * Le paramètre `attendus` (optionnel) permet de surcharger les comptes attendus
 * pour les validations — utilisé par les tests avec des fixtures minimales.
 */
export function buildDataset(
  wilayas: SourceWilaya[],
  communes: SourceCommune[],
  communesDeplacees: MovedCommune[],
  attendus: DatasetAttendus = ATTENDUS_PAR_DEFAUT
): WilayaOutput[] {
  // ── Réaffectation des communes déplacées (Loi 26-06) ────────────────────────
  // communes.json référence encore les 108 communes sous leur ancienne wilaya :
  // on les rattache à leur nouvelle wilaya par nom normalisé + ancien code.
  // NB : on ne mute JAMAIS le tableau d'entrée — on construit une copie réaffectée.
  const indexCommunes = new Map<string, SourceCommune>();
  for (const commune of communes) {
    const cle = `${normalizeName(commune.name)}|${commune.wilayaCode}`;
    indexCommunes.set(cle, commune);
  }

  const nouvellesAffectations = new Map<SourceCommune, number>();
  for (const deplacee of communesDeplacees) {
    const cle = `${normalizeName(deplacee.name)}|${deplacee.oldWilayaCode}`;
    const commune = indexCommunes.get(cle);
    if (!commune) {
      throw new Error(
        `Commune déplacée introuvable dans communes.json : "${deplacee.name}" ` +
          `(ancienne wilaya ${deplacee.oldWilayaCode} → nouvelle wilaya ${deplacee.newWilayaCode})`
      );
    }
    nouvellesAffectations.set(commune, deplacee.newWilayaCode);
  }

  const communesReaffectees = communes.map((commune) => {
    const nouveauCode = nouvellesAffectations.get(commune);
    return nouveauCode !== undefined ? { ...commune, wilayaCode: nouveauCode } : commune;
  });
  const nbReaffectees = nouvellesAffectations.size;

  if (nbReaffectees !== attendus.nbCommunesDeplacees) {
    throw new Error(
      `Validation KO : ${nbReaffectees} communes réaffectées au lieu de ${attendus.nbCommunesDeplacees}`
    );
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  if (wilayas.length !== attendus.nbWilayas) {
    throw new Error(
      `Validation KO : ${wilayas.length} wilayas au lieu de ${attendus.nbWilayas}`
    );
  }
  if (communes.length !== attendus.nbCommunes) {
    throw new Error(
      `Validation KO : ${communes.length} communes au lieu de ${attendus.nbCommunes}`
    );
  }

  const wilayaCodes = new Set(wilayas.map((w) => w.code));
  // Cas théorique : la source ne devrait jamais fournir de codes wilayas dupliqués.
  if (wilayaCodes.size !== wilayas.length) {
    throw new Error(
      `Validation KO : ${wilayas.length - wilayaCodes.size} code(s) wilaya dupliqué(s) dans la source`
    );
  }

  const communesOrphelines = communesReaffectees.filter((c) => !wilayaCodes.has(c.wilayaCode));
  if (communesOrphelines.length > 0) {
    throw new Error(
      `Validation KO : ${communesOrphelines.length} communes référencent une wilaya inexistante ` +
        `(ex. wilayaCode=${communesOrphelines[0].wilayaCode})`
    );
  }

  // Vérification de cohérence du communeCount annoncé par la source.
  // NB : la source compte les communes déplacées dans l'ANCIENNE wilaya ;
  // les nouvelles wilayas ne comptent que leurs communes réelles. On valide donc :
  //   communeCount_source == nb_réel + nb_communes_déplacées_depuis_cette_wilaya
  const nbDeplaceesDepuis = new Map<number, number>();
  for (const deplacee of communesDeplacees) {
    nbDeplaceesDepuis.set(
      deplacee.oldWilayaCode,
      (nbDeplaceesDepuis.get(deplacee.oldWilayaCode) ?? 0) + 1
    );
  }

  const comptesReels = new Map<number, number>();
  for (const commune of communesReaffectees) {
    comptesReels.set(commune.wilayaCode, (comptesReels.get(commune.wilayaCode) ?? 0) + 1);
  }
  const incoherences = wilayas.filter(
    (w) => comptesReels.get(w.code) !== w.communeCount - (nbDeplaceesDepuis.get(w.code) ?? 0)
  );
  if (incoherences.length > 0) {
    throw new Error(
      `Validation KO : ${incoherences.length} wilaya(s) avec communeCount incohérent dans la source : ` +
        incoherences
          .map((w) => `${w.code} (${w.communeCount} vs ${comptesReels.get(w.code)})`)
          .join(", ")
    );
  }

  // ── Transformation ──────────────────────────────────────────────────────────
  const communesParWilaya = new Map<number, SourceCommune[]>();
  for (const commune of communesReaffectees) {
    const liste = communesParWilaya.get(commune.wilayaCode) ?? [];
    liste.push(commune);
    communesParWilaya.set(commune.wilayaCode, liste);
  }

  // Tri des wilayas par code (déterministe)
  const wilayasTriees = [...wilayas].sort((a, b) => a.code - b.code);

  const output: WilayaOutput[] = wilayasTriees.map((wilaya) => {
    const liste = [...(communesParWilaya.get(wilaya.code) ?? [])];
    // Tri stable par nom (insensible à la casse) pour un fichier déterministe
    liste.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, "fr", { sensitivity: "accent" });
      return cmp !== 0 ? cmp : a.name.localeCompare(b.name, "fr");
    });

    const codeWilaya = padCode(wilaya.code);
    const communesOutput: CommuneOutput[] = liste.map((commune, index) => ({
      code: `${codeWilaya}${String(index + 1).padStart(3, "0")}`,
      name: commune.name,
      nameAr: commune.nameAr,
    }));

    return {
      code: codeWilaya,
      name: wilaya.name,
      nameAr: wilaya.nameAr,
      communes: communesOutput,
      // Métadonnées transporteur propagées depuis la source (optionnelles).
      courierSupported: wilaya.courierSupported,
      shipAs: wilaya.shipAs,
      shipAsName: wilaya.shipAsName,
    };
  });

  // Codes de communes uniques (positionnels, donc sensibles au tri)
  const codesCommunes = new Set<string>();
  for (const wilaya of output) {
    for (const commune of wilaya.communes) {
      if (codesCommunes.has(commune.code)) {
        throw new Error(`Validation KO : code de commune dupliqué "${commune.code}"`);
      }
      codesCommunes.add(commune.code);
    }
  }

  return output;
}

async function main(): Promise<void> {
  console.log("🌍 Import des wilayas et communes (dataset dzship, CC0)...\n");

  const [rawWilayas, rawCommunes, rawCsv] = await Promise.all([
    fetchJson(WILAYAS_URL),
    fetchJson(COMMUNES_URL),
    fetchText(MOVED_CSV_URL),
  ]);

  if (!Array.isArray(rawWilayas) || !Array.isArray(rawCommunes)) {
    throw new Error("Réponse inattendue : les fichiers source doivent être des tableaux JSON");
  }

  const wilayas = rawWilayas as SourceWilaya[];
  const communes = rawCommunes as SourceCommune[];
  const communesDeplacees = parseMovedCsv(rawCsv);

  const output = buildDataset(wilayas, communes, communesDeplacees);

  // ── Écriture (UTF-8, 2 espaces, newline finale) ─────────────────────────────
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf-8");

  // ── Résumé ──────────────────────────────────────────────────────────────────
  const nbCommunes = output.reduce((total, w) => total + w.communes.length, 0);
  const nbCommunesParWilaya = output.map((w) => w.communes.length);
  const minCommunes = Math.min(...nbCommunesParWilaya);
  const maxCommunes = Math.max(...nbCommunesParWilaya);

  console.log(`✅ ${output.length} wilayas importées`);
  console.log(`✅ ${nbCommunes} communes importées`);
  console.log(`🔀 ${communesDeplacees.length} communes réaffectées aux nouvelles wilayas (Loi 26-06)`);
  console.log(`📊 Min/Max communes par wilaya : ${minCommunes} / ${maxCommunes}`);
  console.log(`💾 Fichier écrit : ${OUTPUT_PATH}`);
}

// Exécution directe uniquement (npx tsx scripts/import-wilayas-communes.ts) :
// le garde évite que main() ne tourne à l'import du module par les tests vitest.
const estExecuteDirectement =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (estExecuteDirectement) {
  main().catch((error) => {
    console.error("❌ Import échoué :", error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
