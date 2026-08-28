import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

// GET /api/categories — Liste publique
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Erreur GET categories:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/categories — Créer (admin)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, sortOrder } = body;

    if (!name) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    const categorySlug = slug || slugify(name);

    // Vérifier l'unicité du slug
    const existing = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Une catégorie avec ce slug existe déjà" },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: { name, slug: categorySlug, sortOrder: sortOrder || 0 },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Erreur POST category:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
