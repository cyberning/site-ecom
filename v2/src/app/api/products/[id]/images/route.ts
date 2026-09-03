import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/products/[id]/images — Ajouter une image à un produit (admin)
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
    const { url, alt, isPrimary } = body as {
      url?: string;
      alt?: string;
      isPrimary?: boolean;
    };

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL d'image requise" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    // Si isPrimary, désactiver les autres images primaires du produit
    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId: id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const image = await prisma.productImage.create({
      data: {
        productId: id,
        url,
        alt: alt || "",
        isPrimary: isPrimary ?? false,
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("Erreur POST image:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/products/[id]/images?id=xxx — Supprimer une image (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("id");

    if (!imageId) {
      return NextResponse.json({ error: "ID d'image requis" }, { status: 400 });
    }

    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId: id },
    });

    if (!image) {
      return NextResponse.json({ error: "Image non trouvée" }, { status: 404 });
    }

    await prisma.productImage.delete({ where: { id: imageId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE image:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
