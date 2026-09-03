import { describe, it, expect } from "vitest";
import {
  buildDataset,
  normalizeName,
  parseMovedCsv,
  type MovedCommune,
  type SourceCommune,
  type SourceWilaya,
  type WilayaOutput,
} from "../import-wilayas-communes";

// ── Fixtures minimales (3 wilayas, 5 communes, 1 déplacement) ─────────────────
// Aflou est référencée sous l'ancienne wilaya 1 dans communes.json et doit être
// réaffectée à la nouvelle wilaya 59 (Loi 26-06).
const wilayas: SourceWilaya[] = [
  {
    code: 1,
    name: "Adrar",
    nameAr: "أدرار",
    nameAscii: "Adrar",
    communeCount: 3, // 2 réelles + 1 déplacée (Aflou) comptée par la source
    courierSupported: true,
  },
  {
    code: 2,
    name: "Chlef",
    nameAr: "الشلف",
    nameAscii: "Chlef",
    communeCount: 2,
    courierSupported: true,
  },
  {
    code: 59,
    name: "Aflou",
    nameAr: "أفلو",
    nameAscii: "Aflou",
    communeCount: 1, // ne compte que ses communes réelles
    courierSupported: false,
    shipAs: 3,
    shipAsName: "Laghouat",
  },
];

const communes: SourceCommune[] = [
  { wilayaCode: 1, name: "Adrar", nameAr: "أدرار" },
  { wilayaCode: 1, name: "Bouda", nameAr: "بودة" },
  { wilayaCode: 2, name: "Chlef", nameAr: "الشلف" },
  { wilayaCode: 2, name: "Oued Fodda", nameAr: "وادي الفضة" },
  { wilayaCode: 1, name: "Aflou", nameAr: "أفلو" }, // → réaffectée à 59
];

const communesDeplacees: MovedCommune[] = [
  {
    name: "Aflou",
    nameAr: "أفلو",
    oldWilayaCode: 1,
    newWilayaCode: 59,
    newWilayaName: "Aflou",
  },
];

const attendus = { nbWilayas: 3, nbCommunes: 5, nbCommunesDeplacees: 1 };

describe("normalizeName", () => {
  it("supprime les accents", () => {
    expect(normalizeName("Écouteurs")).toBe("ecouteurs");
    expect(normalizeName("Aïn Sidi Ali")).toBe("ain sidi ali");
  });

  it("remplace les apostrophes par des espaces", () => {
    expect(normalizeName("Oued M'Zi")).toBe("oued m zi");
    expect(normalizeName("Aïn Sidi Ali")).toBe("ain sidi ali");
  });

  it("remplace les tirets par des espaces", () => {
    expect(normalizeName("Ain-Sidi-Ali")).toBe("ain sidi ali");
  });

  it("réduit les espaces multiples et trim", () => {
    expect(normalizeName("  Ain   Sidi  Ali  ")).toBe("ain sidi ali");
  });

  it("met en minuscules", () => {
    expect(normalizeName("ADRAR")).toBe("adrar");
  });
});

describe("parseMovedCsv", () => {
  const header =
    "commune_name,commune_name_ar,old_wilaya_code,new_wilaya_code,new_wilaya_name,gazette_name";

  it("parse un CSV valide (header + lignes)", () => {
    const csv = `${header}\nAflou,أفلو,3,59,Aflou,Journal Officiel\nBrida,بريدة,3,59,Aflou,Journal Officiel`;
    const result = parseMovedCsv(csv);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: "Aflou",
      nameAr: "أفلو",
      oldWilayaCode: 3,
      newWilayaCode: 59,
      newWilayaName: "Aflou",
    });
    expect(result[1].name).toBe("Brida");
  });

  it("throw si le header est inattendu", () => {
    expect(() => parseMovedCsv("mauvais,header\nA,B,1,2,C,D")).toThrow(/Header CSV inattendu/);
  });

  it("throw si une ligne a un mauvais nombre de champs", () => {
    const csv = `${header}\nAflou,أفلو,3,59,Aflou`;
    expect(() => parseMovedCsv(csv)).toThrow(/Ligne CSV 2 invalide/);
  });

  it("throw si le CSV est vide", () => {
    expect(() => parseMovedCsv("")).toThrow(/CSV des communes déplacées vide/);
    expect(() => parseMovedCsv("   \n  ")).toThrow(/CSV des communes déplacées vide/);
  });
});

describe("buildDataset", () => {
  it("réaffecte la commune déplacée à sa nouvelle wilaya", () => {
    const output = buildDataset(wilayas, communes, communesDeplacees, attendus);

    const wilaya59 = output.find((w) => w.code === "59");
    const wilaya01 = output.find((w) => w.code === "01");

    expect(wilaya59?.communes.map((c) => c.name)).toContain("Aflou");
    expect(wilaya01?.communes.map((c) => c.name)).not.toContain("Aflou");
  });

  it("fail-fast si une commune déplacée est introuvable", () => {
    const deplaceesInconnues: MovedCommune[] = [
      { name: "Commune Fantôme", nameAr: "x", oldWilayaCode: 1, newWilayaCode: 59, newWilayaName: "Aflou" },
    ];

    expect(() => buildDataset(wilayas, communes, deplaceesInconnues, attendus)).toThrow(
      /Commune déplacée introuvable/
    );
  });

  it("fail-fast si le nombre de wilayas est inattendu", () => {
    expect(() => buildDataset(wilayas.slice(0, 2), communes, communesDeplacees, attendus)).toThrow(
      /2 wilayas au lieu de 3/
    );
  });

  it("fail-fast si le nombre de communes est inattendu", () => {
    expect(() =>
      buildDataset(wilayas, communes, communesDeplacees, { ...attendus, nbCommunes: 4 })
    ).toThrow(/5 communes au lieu de 4/);
  });

  it("génère des codes positionnels corrects (préfixe wilaya + index)", () => {
    const output = buildDataset(wilayas, communes, communesDeplacees, attendus);

    const wilaya01 = output.find((w) => w.code === "01");
    // Communes triées par nom : Adrar puis Bouda
    expect(wilaya01?.communes.map((c) => c.code)).toEqual(["01001", "01002"]);

    const wilaya59 = output.find((w) => w.code === "59");
    expect(wilaya59?.communes.map((c) => c.code)).toEqual(["59001"]);
  });

  it("tri déterministe : 2 appels (entrées mélangées) → même résultat", () => {
    const wilayasMelangees = [...wilayas].reverse();
    const communesMelangees = [...communes].reverse();

    const premier = buildDataset(wilayas, communes, communesDeplacees, attendus);
    const second = buildDataset(wilayasMelangees, communesMelangees, communesDeplacees, attendus);

    expect(second).toEqual(premier);
  });

  it("produit des codes de communes uniques", () => {
    const output = buildDataset(wilayas, communes, communesDeplacees, attendus);

    const codes = output.flatMap((w) => w.communes.map((c) => c.code));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("propagate les métadonnées transporteur depuis la source", () => {
    const output = buildDataset(wilayas, communes, communesDeplacees, attendus);

    const wilaya59 = output.find((w) => w.code === "59");
    expect(wilaya59?.courierSupported).toBe(false);
    expect(wilaya59?.shipAs).toBe(3);
    expect(wilaya59?.shipAsName).toBe("Laghouat");

    // Wilaya ancienne : courierSupported fourni par la source, pas de shipAs
    const wilaya01 = output.find((w) => w.code === "01");
    expect(wilaya01?.courierSupported).toBe(true);
    expect(wilaya01?.shipAs).toBeUndefined();
    expect(wilaya01?.shipAsName).toBeUndefined();
  });

  it("fail-fast si des codes wilayas sont dupliqués", () => {
    const wilayasDupliquees: SourceWilaya[] = [
      ...wilayas,
      { ...wilayas[0] }, // code 1 en double
    ];

    expect(() =>
      buildDataset(wilayasDupliquees, communes, communesDeplacees, {
        ...attendus,
        nbWilayas: 4,
      })
    ).toThrow(/code\(s\) wilaya dupliqué/);
  });

  it("fail-fast si une commune référence une wilaya inexistante", () => {
    const communesOrphelines: SourceCommune[] = [
      ...communes,
      { wilayaCode: 99, name: "Orpheline", nameAr: "x" },
    ];

    expect(() =>
      buildDataset(wilayas, communesOrphelines, communesDeplacees, {
        ...attendus,
        nbCommunes: 6,
      })
    ).toThrow(/communes référencent une wilaya inexistante/);
  });

  it("fail-fast si communeCount est incohérent avec la source", () => {
    const wilayasIncoherentes: SourceWilaya[] = [
      { ...wilayas[0], communeCount: 99 },
      ...wilayas.slice(1),
    ];

    expect(() => buildDataset(wilayasIncoherentes, communes, communesDeplacees, attendus)).toThrow(
      /communeCount incohérent/
    );
  });

  it("le résultat est sérialisable en JSON sans champs undefined", () => {
    const output = buildDataset(wilayas, communes, communesDeplacees, attendus);
    const json = JSON.parse(JSON.stringify(output)) as WilayaOutput[];

    // Les champs absents de la source ne doivent pas apparaître dans le JSON
    const wilaya01 = json.find((w) => w.code === "01");
    expect(wilaya01).not.toHaveProperty("shipAs");
    expect(wilaya01).not.toHaveProperty("shipAsName");
    expect(wilaya01).toHaveProperty("courierSupported", true);

    const wilaya59 = json.find((w) => w.code === "59");
    expect(wilaya59).toHaveProperty("courierSupported", false);
    expect(wilaya59).toHaveProperty("shipAs", 3);
    expect(wilaya59).toHaveProperty("shipAsName", "Laghouat");
  });
});