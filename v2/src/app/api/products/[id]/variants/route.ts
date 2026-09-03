import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { variantSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";

// POST /api/products/[id]/variants — Ajouter une variante à un produit (admin)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    const parsed = variantSchema
      .omit({ productId: true })
      .safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;

    // Générer le SKU s'il est absent : slug du produit + nom de la variante
    let sku = data.sku;
    if (!sku) {
      const base = slugify(product.name);
      const variantPart = slugify(data.name);
      sku = `${base}-${variantPart}`.toUpperCase();
    }

    // Vérifier l'unicité du SKU
    const existingSku = await prisma.variant.findUnique({ where: { sku } });
    if (existingSku) {
      return NextResponse.json({ error: "Une variante avec ce SKU existe déjà" }, { status: 409 });
    }

    const variant = await prisma.variant.create({
      data: {
        productId: id,
        name: data.name,
        sku,
        price: data.price,
        stock: data.stock,
        imageId: data.imageId ?? null,
      },
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (error) {
    console.error("Erreur POST variant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
