import { describe, it, expect } from "vitest";
import {
  checkoutSchema,
  productSchema,
  phoneSchema,
  loginSchema,
  orderStatusSchema,
} from "../validators";

describe("phoneSchema", () => {
  it("valide un numéro commençant par 05", () => {
    expect(phoneSchema.safeParse("0555123456").success).toBe(true);
  });

  it("valide un numéro commençant par 06", () => {
    expect(phoneSchema.safeParse("0661234567").success).toBe(true);
  });

  it("valide un numéro commençant par 07", () => {
    expect(phoneSchema.safeParse("0770123456").success).toBe(true);
  });

  it("rejette un numéro commençant par 01", () => {
    expect(phoneSchema.safeParse("0123456789").success).toBe(false);
  });

  it("rejette un numéro trop court", () => {
    expect(phoneSchema.safeParse("055512345").success).toBe(false);
  });

  it("rejette un numéro trop long", () => {
    expect(phoneSchema.safeParse("05551234567").success).toBe(false);
  });

  it("rejette une chaîne vide", () => {
    expect(phoneSchema.safeParse("").success).toBe(false);
  });
});

describe("checkoutSchema", () => {
  const validCheckout = {
    customerName: "Ahmed Benali",
    customerPhone: "0555123456",
    fullAddress: "123 Rue Principale, Alger",
    wilayaCode: "16",
    communeCode: "16001",
    deliveryMode: "HOME" as const,
    variantId: "v1",
    quantity: 2,
  };

  it("valide un checkout valide", () => {
    const result = checkoutSchema.safeParse(validCheckout);
    expect(result.success).toBe(true);
  });

  it("applique la valeur par défaut quantity=1 si non fourni", () => {
    const { quantity, ...checkoutWithoutQty } = validCheckout;
    const result = checkoutSchema.safeParse(checkoutWithoutQty);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
    }
  });

  it("rejette un nom trop court (< 2 caractères)", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, customerName: "A" });
    expect(result.success).toBe(false);
  });

  it("rejette un téléphone invalide", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, customerPhone: "012345678" });
    expect(result.success).toBe(false);
  });

  it("rejette une adresse trop courte (< 5 caractères)", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, fullAddress: "12" });
    expect(result.success).toBe(false);
  });

  it("rejette un variantId vide", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, variantId: "" });
    expect(result.success).toBe(false);
  });

  it("rejette une wilayaCode vide", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, wilayaCode: "" });
    expect(result.success).toBe(false);
  });

  it("rejette un deliveryMode invalide", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, deliveryMode: "PICKUP" });
    expect(result.success).toBe(false);
  });

  it("accepte STOP_DESK comme deliveryMode", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, deliveryMode: "STOP_DESK" });
    expect(result.success).toBe(true);
  });

  it("rejette une quantity négative", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, quantity: -1 });
    expect(result.success).toBe(false);
  });
});

describe("productSchema", () => {
  it("valide un produit minimaliste", () => {
    const result = productSchema.safeParse({
      name: "T-shirt Premium",
      basePrice: 1500,
    });
    expect(result.success).toBe(true);
  });

  it("valide un produit complet", () => {
    const result = productSchema.safeParse({
      name: "T-shirt Premium",
      slug: "t-shirt-premium",
      description: "Un t-shirt de qualité",
      shortDesc: "T-shirt premium",
      basePrice: 1500,
      isActive: true,
      isFeatured: false,
      categoryId: "cat-1",
      seoTitle: "T-shirt",
      seoDescription: "Description SEO",
      seoKeywords: "t-shirt, premium",
      sortOrder: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejette un nom vide", () => {
    const result = productSchema.safeParse({
      name: "",
      basePrice: 1500,
    });
    expect(result.success).toBe(false);
  });

  it("rejette un prix négatif", () => {
    const result = productSchema.safeParse({
      name: "Test",
      basePrice: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejette un prix zéro", () => {
    const result = productSchema.safeParse({
      name: "Test",
      basePrice: 0,
    });
    expect(result.success).toBe(false);
  });

  it("applique les valeurs par défaut", () => {
    const result = productSchema.safeParse({
      name: "Test",
      basePrice: 1000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
      expect(result.data.isFeatured).toBe(false);
      expect(result.data.sortOrder).toBe(0);
    }
  });
});

describe("loginSchema", () => {
  it("valide un login valide", () => {
    const result = loginSchema.safeParse({
      email: "admin@test.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejette un email invalide", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejette un mot de passe trop court", () => {
    const result = loginSchema.safeParse({
      email: "admin@test.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("orderStatusSchema", () => {
  it("valide tous les statuts valides", () => {
    const statuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
    for (const status of statuses) {
      expect(orderStatusSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it("rejette un statut invalide", () => {
    expect(orderStatusSchema.safeParse({ status: "UNKNOWN" }).success).toBe(false);
  });

  it("accepte une note optionnelle", () => {
    const result = orderStatusSchema.safeParse({
      status: "CONFIRMED",
      note: "Commande confirmée par l'admin",
    });
    expect(result.success).toBe(true);
  });
});
