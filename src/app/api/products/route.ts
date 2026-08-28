import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { productSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";

// GET /api/products — Liste paginée avec filtres (publique)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const active = searchParams.get("active");
    const featured = searchParams.get("featured");
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const where: Prisma.ProductWhereInput = {};
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (category) where.categoryId = category;
    if (active !== null && active !== undefined) where.isActive = active === "true";
    if (featured !== null && featured !== undefined) where.isFeatured = featured === "true";

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { where: { isPrimary: true }, take: 1 },
          variants: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur GET products:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/products — Créer un produit (admin uniquement)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const slug = data.slug || slugify(data.name);

    // Vérifier l'unicité du slug
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Un produit avec ce slug existe déjà" }, { status: 409 });
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        slug,
        basePrice: data.basePrice,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Erreur POST product:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
