import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Providers disponibles pour le tracking pixels.
 */
const AVAILABLE_PROVIDERS = [
  { code: "META", name: "Meta (Facebook Ads)", description: "Meta Conversions API (CAPI)" },
  { code: "TIKTOK", name: "TikTok Ads", description: "TikTok Events API" },
  { code: "GOOGLE", name: "Google Ads", description: "Google Ads Enhanced Conversions" },
];

// GET /api/admin/pixels — Liste des pixels + providers disponibles
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const pixels = await prisma.pixel.findMany({
    orderBy: { type: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      pixelId: true,
      isActive: true,
      isGlobal: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ pixels, availableProviders: AVAILABLE_PROVIDERS });
}

// POST /api/admin/pixels — Créer un pixel
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { type, pixelId, name, accessToken } = body;

  if (!type || !pixelId) {
    return NextResponse.json({ error: "Type de provider et pixelId requis" }, { status: 400 });
  }

  // Vérifier que le provider est supporté
  const validProvider = AVAILABLE_PROVIDERS.find((p) => p.code === type.toUpperCase());
  if (!validProvider) {
    return NextResponse.json(
      { error: `Provider inconnu: ${type}. Utilisez META, TIKTOK ou GOOGLE.` },
      { status: 400 }
    );
  }

  // Vérifier l'unicité par type + pixelId
  const existing = await prisma.pixel.findFirst({
    where: { type: type.toUpperCase(), pixelId },
  });
  if (existing) {
    return NextResponse.json({ error: "Ce pixel existe déjà" }, { status: 409 });
  }

  const pixel = await prisma.pixel.create({
    data: {
      name: name || validProvider.name,
      type: type.toUpperCase(),
      pixelId,
      accessToken: accessToken || null,
      isActive: true,
      isGlobal: true,
    },
  });

  return NextResponse.json(pixel, { status: 201 });
}

// PATCH /api/admin/pixels — Mettre à jour (isActive, accessToken, name)
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { id, isActive, accessToken, name } = body;

  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  const pixel = await prisma.pixel.update({
    where: { id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(accessToken !== undefined && { accessToken }),
      ...(name !== undefined && { name }),
    },
  });

  return NextResponse.json(pixel);
}

// DELETE /api/admin/pixels?id=xxx — Supprimer un pixel
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  await prisma.pixel.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
