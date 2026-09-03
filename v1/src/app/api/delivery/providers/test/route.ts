import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { testDzshipConnection } from "@/lib/logistics/providers/dzship";

// POST /api/delivery/providers/test — teste une connexion transporteur
// (appelle /v1/rates de dzship, NE sauvegarde RIEN)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, credentials, baseUrl } = body as {
      code?: string;
      credentials?: Record<string, string>;
      baseUrl?: string;
    };

    if (!code || typeof code !== "string" || code.trim() === "") {
      return NextResponse.json({ error: "Le champ 'code' est requis" }, { status: 400 });
    }

    // credentials peut être vide ({}) pour les couriers sans credentials (ex. sandbox dzship)
    if (!credentials || typeof credentials !== "object" || Array.isArray(credentials)) {
      return NextResponse.json(
        { error: "Le champ 'credentials' est requis (objet)" },
        { status: 400 }
      );
    }

    // Chaque valeur de credentials doit être une chaîne non vide
    if (Object.values(credentials).some((v) => typeof v !== "string" || v.trim() === "")) {
      return NextResponse.json(
        { error: "Tous les champs credentials doivent être remplis" },
        { status: 400 }
      );
    }

    const result = await testDzshipConnection(code.trim(), credentials, baseUrl);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur test connexion dzship:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
