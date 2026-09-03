import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { variantSchema } from "@/lib/validators";

// PUT /api/products/[id]/variants — Remplace les variantes d'un produit (admin)
// Reçoit la liste complète des variantes et fait le diff côté serveur
// (suppression des variantes absentes, mise à jour des existantes, création des nouvelles).
// Évite le N+1 fetches du client (1 DELETE + 1 PUT/POST par variante).
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const rawVariants = Array.isArray(body.variants) ? body.variants : null;
    if (!rawVariants) {
      return NextResponse.json({ error: "Le champ 'variants' est obligatoire" }, { status: 400 });
    }

    // Valider chaque variante (productId est déduit de l'URL)
    const variantInputSchema = variantSchema.omit({ productId: true });
    type VariantInput = z.infer<typeof variantInputSchema> & { id?: string };

    const parsedVariants: VariantInput[] = [];
    for (const raw of rawVariants) {
      const variant = raw as Record<string, unknown>;
      const id = typeof variant.id === "string" ? variant.id : undefined;
      const parsed = variantInputSchema.safeParse(variant);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
      }
      parsedVariants.push({ ...parsed.data, id });
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingVariants = await tx.variant.findMany({
        where: { productId: id },
        select: { id: true },
      });
      const existingIds = new Set(existingVariants.map((v) => v.id));

      const incomingIds = new Set(parsedVariants.filter((v) => v.id).map((v) => v.id as string));

      // Variantes à supprimer (présentes en base mais absentes de la liste envoyée)
      const toDelete = existingVariants.filter((v) => !incomingIds.has(v.id)).map((v) => v.id);

      // Variantes à mettre à jour (id présent et appartenant au produit)
      const toUpdate = parsedVariants.filter((v) => v.id && existingIds.has(v.id));

      // Variantes à créer (sans id)
      const toCreate = parsedVariants.filter((v) => !v.id);

      // Règle d'unicité du SKU (même comportement que POST /api/variants).
      // Couvre les créations ET les mises à jour : un admin peut modifier le SKU
      // d'une variante existante et le faire collider avec une autre variante.
      const skusToCheck = parsedVariants
        .map((v) => v.sku)
        .filter((sku): sku is string => Boolean(sku));
      if (skusToCheck.length > 0) {
        // Collision au sein du lot envoyé (toUpdate ∪ toCreate)
        const hasDuplicateInBatch = new Set(skusToCheck).size !== skusToCheck.length;

        // Collision avec la base, en excluant les variantes mises à jour elles-mêmes
        // (notIn: [] quand aucune mise à jour → vérifie toutes les variantes existantes)
        const updatedIds = toUpdate.map((v) => v.id as string);
        const skuConflict = await tx.variant.findFirst({
          where: {
            sku: { in: skusToCheck },
            id: { notIn: updatedIds },
          },
          select: { sku: true },
        });

        if (hasDuplicateInBatch || skuConflict) {
          throw new Error("Une variante avec ce SKU existe déjà");
        }
      }

      if (toDelete.length > 0) {
        await tx.variant.deleteMany({ where: { id: { in: toDelete } } });
      }

      for (const variant of toUpdate) {
        if (!variant.id) continue;
        await tx.variant.update({
          where: { id: variant.id },
          data: {
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            isActive: variant.isActive,
            sortOrder: variant.sortOrder,
            imageId: variant.imageId,
          },
        });
      }

      for (const variant of toCreate) {
        await tx.variant.create({
          data: {
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            isActive: variant.isActive,
            sortOrder: variant.sortOrder,
            imageId: variant.imageId,
            productId: id,
          },
        });
      }

      return { deleted: toDelete.length, updated: toUpdate.length, created: toCreate.length };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Une variante avec ce SKU existe déjà") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Erreur PUT variants:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
