import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConnections } from "@/lib/delivery/connections";

// ============================================
// Calcul des frais de livraison — route PUBLIQUE (storefront).
// Tarifs dzship (/v1/rates) avec repli silencieux sur la matrice wilayas.
// Le checkout ne doit JAMAIS casser : on retourne toujours { fee, estimatedDays }.
// ============================================

const DZSHIP_RATES_URL = "https://freeship.dzbuild.com/v1/rates";

// Cache court des tarifs dzship (module-level, TTL 5 min) pour respecter le
// rate limit dzship (60 req/min). Clé : fromWilaya|toWilaya|deliveryType.
// La commune et le transporteur sont volontairement exclus de la clé (décision
// produit : tarifs par wilaya, première connexion active = transporteur par
// défaut) — le TTL court borne la fraîcheur si la connexion par défaut change.
const RATES_CACHE_TTL_MS = 5 * 60 * 1000;
const ratesCache = new Map<string, { fee: number; estimatedDays: number; expiresAt: number }>();

interface DzshipRatesResponse {
  deliveryFee?: number;
  estimatedDays?: number;
}

function getCachedRate(key: string): { fee: number; estimatedDays: number } | undefined {
  const entry = ratesCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    ratesCache.delete(key);
    return undefined;
  }
  return { fee: entry.fee, estimatedDays: entry.estimatedDays };
}

function setCachedRate(key: string, fee: number, estimatedDays: number): void {
  ratesCache.set(key, { fee, estimatedDays, expiresAt: Date.now() + RATES_CACHE_TTL_MS });
}

/** Repli sur la matrice wilayas (logique historique inchangée). */
async function fallbackToMatrix(
  wilayaCode: string,
  deliveryMode: string
): Promise<{ fee: number; estimatedDays: number }> {
  const matrix = await prisma.deliveryMatrix.findUnique({
    where: { wilayaCode },
  });

  if (!matrix || !matrix.isActive) {
    // Pas de matrice = livraison gratuite par défaut
    return { fee: 0, estimatedDays: 2 };
  }

  return {
    fee: Number(deliveryMode === "STOP_DESK" ? matrix.stopDeskFee : matrix.homeFee),
    estimatedDays: matrix.estimatedDays,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { wilayaCode, deliveryMode, communeName } = await request.json();

    if (!wilayaCode) {
      return NextResponse.json({ error: "Code wilaya requis" }, { status: 400 });
    }

    const toWilaya = parseInt(wilayaCode, 10);
    if (Number.isNaN(toWilaya)) {
      // wilayaCode non numérique : dzship ininterrogeable → repli matrice
      return NextResponse.json(await fallbackToMatrix(wilayaCode, deliveryMode));
    }

    const connections = (await getConnections()).filter((c) => c.isActive);
    if (connections.length === 0) {
      // Aucun transporteur configuré → repli matrice
      return NextResponse.json(await fallbackToMatrix(wilayaCode, deliveryMode));
    }

    // Première connexion active = transporteur par défaut
    const connection = connections[0];
    const deliveryType = deliveryMode === "STOP_DESK" ? "stopdesk" : "home";
    const fromWilaya = connection.fromWilaya ?? 16;
    const cacheKey = `${fromWilaya}|${toWilaya}|${deliveryType}`;

    const cached = getCachedRate(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    try {
      const options: Record<string, unknown> = {};
      if (connection.baseUrl) options.baseUrl = connection.baseUrl;

      const response = await fetch(DZSHIP_RATES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Timeout 10 s : un appel bloqué ne doit pas figer le checkout
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
          courier: connection.code,
          credentials: connection.credentials,
          options,
          query: {
            fromWilaya,
            toWilaya,
            ...(communeName ? { toCommune: communeName } : {}),
            deliveryType,
          },
        }),
      });

      const data = (await response.json()) as DzshipRatesResponse;

      if (!response.ok) {
        // Erreur dzship (400/422/502…) → repli silencieux sur la matrice.
        // Pas de cache négatif : les erreurs dzship sont généralement
        // transitoires et le repli matrice est peu coûteux.
        return NextResponse.json(await fallbackToMatrix(wilayaCode, deliveryMode));
      }

      const fee = data.deliveryFee ?? 0;
      const estimatedDays = data.estimatedDays ?? 2;
      setCachedRate(cacheKey, fee, estimatedDays);
      return NextResponse.json({ fee, estimatedDays });
    } catch (error) {
      // Timeout, réseau, JSON invalide… → repli silencieux sur la matrice
      console.error("Erreur appel dzship /v1/rates:", error);
      return NextResponse.json(await fallbackToMatrix(wilayaCode, deliveryMode));
    }
  } catch (error) {
    console.error("Erreur calcul livraison:", error);
    return NextResponse.json({ fee: 0, estimatedDays: 2 });
  }
}
