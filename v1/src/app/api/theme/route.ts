import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

const getActiveTheme = cache(async () => {
  const setting = await prisma.setting.findUnique({
    where: { key: "active_theme" },
  });
  // Prisma retourne le Json tel quel — si c'est une string stockée, elle est retournée en string
  return (setting?.value as string) || "NEUMORPHISM";
});

export async function GET() {
  try {
    const theme = await getActiveTheme();
    return NextResponse.json({ theme });
  } catch {
    return NextResponse.json({ theme: "NEUMORPHISM" });
  }
}
