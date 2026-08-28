import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { variantSchema } from "@/lib/validators";

// GET /api/variants/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const variant = await prisma.variant.findUnique({
      where: { id },
      include: {
        product: true,
        image: true,
      },
    });

    if (!variant) {
      return NextResponse.json({ error: "Variante non trouvée" }, { status: 404 });
    }

    return NextResponse.json(variant);
  } catch (error) {
    console.error("Erreur GET variant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/variants/[id] — Toggle active + update
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = variantSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const existing = await prisma.variant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Variante non trouvée" }, { status: 404 });
    }

    const variant = await prisma.variant.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(variant);
  } catch (error) {
    console.error("Erreur PUT variant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/variants/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.variant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Variante non trouvée" }, { status: 404 });
    }

    await prisma.variant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE variant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
