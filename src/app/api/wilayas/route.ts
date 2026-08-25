import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

const getWilayas = cache(async () => {
  return prisma.wilaya.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });
});

export async function GET() {
  try {
    const wilayas = await getWilayas();
    return NextResponse.json(wilayas);
  } catch (error) {
    console.error("Erreur récupération wilayas:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
