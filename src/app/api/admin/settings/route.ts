import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/settings?category=theme
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const where = category ? { category } : {};
  const settings = await prisma.setting.findMany({ where });

  return NextResponse.json(settings);
}

// PUT /api/admin/settings
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { key, value, type, category, description } = body;

  if (!key || value === undefined) {
    return NextResponse.json({ error: "Clé et valeur requises" }, { status: 400 });
  }

  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value, type, category, description },
    create: { key, value, type, category, description },
  });

  return NextResponse.json(setting);
}
