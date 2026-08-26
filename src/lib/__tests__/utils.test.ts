import { describe, it, expect } from "vitest";
import { cn, formatPrice, generateTrackingId, slugify, normalizePhone } from "../utils";

describe("cn", () => {
  it("fusionne les classes en résolvant les conflits Tailwind", () => {
    const result = cn("text-red-500", "text-blue-500");
    // twMerge resolves conflicts: blue overrides red
    expect(result).toBe("text-blue-500");
  });

  it("gère les valeurs falsy sans erreur", () => {
    const result = cn("base", null, undefined, false, "");
    expect(result).toBe("base");
  });

  it("retourne une chaîne vide si aucune classe", () => {
    expect(cn()).toBe("");
  });

  it("fusionne des classes multiples sans conflit", () => {
    const result = cn("p-4", "m-2", "text-sm");
    expect(result).toContain("p-4");
    expect(result).toContain("m-2");
    expect(result).toContain("text-sm");
  });
});

describe("formatPrice", () => {
  it("formate un prix entier en DA", () => {
    const result = formatPrice(1500);
    expect(result).toContain("1");
    expect(result).toContain("500");
    expect(result).toContain("DA");
  });

  it("formate un prix avec décimales", () => {
    const result = formatPrice(99.99);
    expect(result).toContain("DA");
    expect(result).toContain("99");
  });

  it("formate le prix zéro", () => {
    const result = formatPrice(0);
    expect(result).toContain("0");
    expect(result).toContain("DA");
  });

  it("formate un prix élevé", () => {
    const result = formatPrice(125000);
    expect(result).toContain("DA");
    expect(result).toContain("125");
  });
});

describe("generateTrackingId", () => {
  it("commence par DZ-", () => {
    const id = generateTrackingId();
    expect(id).toMatch(/^DZ-/);
  });

  it("contient un timestamp et un random", () => {
    const id = generateTrackingId();
    const parts = id.split("-");
    expect(parts.length).toBeGreaterThanOrEqual(3); // DZ - timestamp - random
  });

  it("génère des IDs uniques", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateTrackingId()));
    expect(ids.size).toBe(100);
  });
});

describe("slugify", () => {
  it("convertit en slug basique", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("supprime les diacritiques", () => {
    expect(slugify("Café Résumé")).toBe("cafe-resume");
  });

  it("gère les caractères spéciaux", () => {
    // Les caractères spéciaux sont remplacés par des tirets
    const result = slugify("Produit & Cie!");
    expect(result).not.toContain("&");
    expect(result).not.toContain("!");
    expect(result).not.toContain(" ");
  });

  it("trim les tirets en début et fin", () => {
    expect(slugify(" hello ")).toBe("hello");
  });

  it("gère une chaîne vide", () => {
    expect(slugify("")).toBe("");
  });
});

describe("normalizePhone", () => {
  it("supprime les espaces normaux", () => {
    expect(normalizePhone("0555 123 456")).toBe("0555123456");
  });

  it("supprime les espaces insécables (\\u00A0)", () => {
    expect(normalizePhone("0555\u00A0123\u00A0456")).toBe("0555123456");
  });

  it("retourne le numéro tel quel s'il n'y a pas d'espaces", () => {
    expect(normalizePhone("0555123456")).toBe("0555123456");
  });

  it("gère une chaîne vide", () => {
    expect(normalizePhone("")).toBe("");
  });
});
