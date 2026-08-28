import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { variantSchema } from "@/lib/validators";

// POST /api/variants — Créer une variante (admin)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = variantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;

    // Vérifier que le produit existe
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });
    if (!product) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    // Vérifier l'unicité du SKU si fourni
    if (data.sku) {
      const existingSku = await prisma.variant.findUnique({
        where: { sku: data.sku },
      });
      if (existingSku) {
        return NextResponse.json(
          { error: "Une variante avec ce SKU existe déjà" },
          { status: 409 }
        );
      }
    }

    const variant = await prisma.variant.create({
      data,
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (error) {
    console.error("Erreur POST variant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
