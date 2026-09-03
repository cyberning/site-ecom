import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { removeConnection } from "@/lib/delivery/connections";

// DELETE /api/delivery/providers/[code] — supprime une connexion transporteur
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { code } = await params;
    await removeConnection(code);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE delivery provider:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
