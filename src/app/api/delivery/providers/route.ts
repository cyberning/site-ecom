import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  DeliveryConnection,
  getConnections,
  maskCredentials,
  saveConnection,
} from "@/lib/delivery/connections";

const DZSHIP_API_URL = "https://freeship.dzbuild.com/v1";

// Cache module simple : la liste des transporteurs dzship change rarement
let couriersCache: { data: unknown; fetchedAt: number } | null = null;
const COURIERS_CACHE_TTL = 60 * 60 * 1000; // 1 heure

async function fetchCouriers(): Promise<unknown> {
  const now = Date.now();
  if (couriersCache && now - couriersCache.fetchedAt < COURIERS_CACHE_TTL) {
    return couriersCache.data;
  }

  const response = await fetch(`${DZSHIP_API_URL}/couriers`, {
    headers: { Accept: "application/json" },
    // Timeout 10s : évite qu'un appel bloqué ne fige la requête
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`dzship couriers: HTTP ${response.status}`);
  }

  const data = await response.json();
  couriersCache = { data, fetchedAt: now };
  return data;
}

// GET /api/delivery/providers — liste des transporteurs dzship + connexions locales (masquées)
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const connections = (await getConnections()).map(maskCredentials);

  try {
    const couriers = await fetchCouriers();
    return NextResponse.json({ couriers, connections });
  } catch (error) {
    console.error("Erreur fetch couriers dzship:", error);
    // Ne pas faire planter la page : on renvoie les connexions locales + une erreur
    return NextResponse.json({
      couriers: [],
      connections,
      couriersError: "Impossible de récupérer la liste des transporteurs dzship",
    });
  }
}

// POST /api/delivery/providers — enregistre une connexion transporteur
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, name, platform, credentials, baseUrl, fromWilaya } = body as {
      code?: string;
      name?: string;
      platform?: string;
      credentials?: Record<string, string>;
      baseUrl?: string;
      fromWilaya?: number;
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

    // fromWilaya : entier entre 1 et 58 (wilayas algériennes) si fourni
    if (fromWilaya !== undefined) {
      if (!Number.isInteger(fromWilaya) || fromWilaya < 1 || fromWilaya > 58) {
        return NextResponse.json(
          { error: "Le champ 'fromWilaya' doit être un entier entre 1 et 58" },
          { status: 400 }
        );
      }
    }

    // baseUrl : URL http(s) valide si fournie
    if (baseUrl !== undefined) {
      try {
        const parsed = new URL(baseUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          throw new Error("protocole non http(s)");
        }
      } catch {
        return NextResponse.json(
          { error: "Le champ 'baseUrl' doit être une URL http(s) valide" },
          { status: 400 }
        );
      }
    }

    const connection: DeliveryConnection = {
      code: code.trim(),
      name: name?.trim() || code.trim(),
      platform: platform?.trim() || code.trim(),
      credentials,
      ...(baseUrl ? { baseUrl } : {}),
      ...(fromWilaya !== undefined ? { fromWilaya } : {}),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await saveConnection(connection);

    return NextResponse.json(maskCredentials(connection));
  } catch (error) {
    console.error("Erreur POST delivery providers:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
