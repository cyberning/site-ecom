import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";

interface ImageInput {
  id?: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}

// PUT /api/products/[id]/images — Remplacer toutes les images d'un produit (admin)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const images: ImageInput[] = body.images;

    if (!Array.isArray(images)) {
      return NextResponse.json({ error: "Format invalide" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    // Récupérer les images existantes pour nettoyer les fichiers orphelins
    const existingImages = await prisma.productImage.findMany({
      where: { productId: id },
    });

    const incomingIds = new Set(images.filter((img) => img.id).map((img) => img.id!));

    // Supprimer les fichiers des images retirées
    const removedImages = existingImages.filter((img) => !incomingIds.has(img.id));
    for (const img of removedImages) {
      if (img.url.startsWith("/uploads/")) {
        try {
          await unlink(path.join(process.cwd(), "public", img.url));
        } catch {
          // Fichier déjà supprimé ou introuvable — ignorer
        }
      }
    }

    // Supprimer les anciens enregistrements
    await prisma.productImage.deleteMany({ where: { productId: id } });

    // Créer les nouveaux enregistrements
    if (images.length > 0) {
      await prisma.productImage.createMany({
        data: images.map((img) => ({
          productId: id,
          url: img.url,
          alt: img.alt || "",
          isPrimary: img.isPrimary,
          sortOrder: img.sortOrder,
        })),
      });
    }

    // Retourner les images mises à jour
    const updatedImages = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(updatedImages);
  } catch (error) {
    console.error("Erreur PUT images:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
