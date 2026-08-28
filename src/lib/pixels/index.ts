/**
 * Dispatcher de tracking pixels — factory pour les providers,
 * fonction d'envoi groupé de tous les pixels actifs.
 *
 * Usage :
 *   import { fireAllActivePixels } from "@/lib/pixels";
 *   await fireAllActivePixels({ eventName: "Purchase", ... });
 */

import { PixelProvider, PixelEvent } from "./types";
import { MetaPixelProvider } from "./providers/meta";
import { TikTokPixelProvider } from "./providers/tiktok";
import { GoogleAdsPixelProvider } from "./providers/google";

/** Cache singleton des instances de providers */
const providers = new Map<string, PixelProvider>();

/** Retourne (ou crée) un provider par code */
function getProvider(code: string): PixelProvider {
  const upperCode = code.toUpperCase();
  if (providers.has(upperCode)) return providers.get(upperCode)!;

  let provider: PixelProvider;
  switch (upperCode) {
    case "META":
      provider = new MetaPixelProvider();
      break;
    case "TIKTOK":
      provider = new TikTokPixelProvider();
      break;
    case "GOOGLE":
      provider = new GoogleAdsPixelProvider();
      break;
    default:
      throw new Error(`Provider pixel inconnu: ${code}`);
  }

  providers.set(upperCode, provider);
  return provider;
}

/**
 * Envoie un événement à un pixel spécifique.
 */
export async function fireConversionEvent(
  pixelId: string,
  providerCode: string,
  event: PixelEvent,
  accessToken?: string
) {
  try {
    const provider = getProvider(providerCode);
    return await provider.sendEvent(pixelId, event, accessToken);
  } catch (error) {
    console.error(`Pixel error (${providerCode}/${pixelId}):`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * Envoie un événement à TOUS les pixels actifs enregistrés en base.
 * Utilise `Promise.allSettled` pour ne pas bloquer si un pixel échoue.
 */
export async function fireAllActivePixels(event: PixelEvent) {
  const { prisma } = await import("@/lib/prisma");
  const activePixels = await prisma.pixel.findMany({
    where: { isActive: true },
  });

  const results = await Promise.allSettled(
    activePixels.map((pixel) =>
      fireConversionEvent(pixel.pixelId, pixel.type, event, pixel.accessToken ?? undefined)
    )
  );

  return {
    total: activePixels.length,
    succeeded: results.filter((r) => r.status === "fulfilled" && r.value.success).length,
    failed: results.filter(
      (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success)
    ).length,
  };
}

export type { PixelProvider, PixelEvent } from "./types";
