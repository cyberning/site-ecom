import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changeEmailSchema } from "@/lib/validators";

// PATCH /api/auth/account — changer son propre email
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
    }

    const parsed = changeEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    // Normalisation : minuscules + suppression des espaces pour éviter les doublons
    const email = parsed.data.email.toLowerCase().trim();

    // Pré-check : l'email ne doit pas déjà être utilisé par un AUTRE utilisateur
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    // Secours : gestion de la contrainte d'unicité (course condition)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    }
    console.error("Erreur lors du changement d'email :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
