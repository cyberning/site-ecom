/**
 * Types partagés pour le système de tracking pixels server-side.
 *
 * Chaque provider (Meta CAPI, TikTok Events API, Google Ads) implémente
 * l'interface `PixelProvider` et reçoit des événements au format `PixelEvent`.
 */

export interface PixelEvent {
  /** Nom de l'événement (ex: "Purchase", "PageView", "AddToCart") */
  eventName: string;
  /** Identifiant unique de l'événement pour le dé-duplication côté provider */
  eventId?: string;
  /** Timestamp Unix (secondes) */
  timestamp: number;
  userData: {
    externalId?: string;
    email?: string;
    phone?: string;
    ip?: string;
    userAgent?: string;
  };
  customData?: Record<string, unknown>;
}

export interface PixelProvider {
  readonly name: string;
  readonly code: string;
  sendEvent(
    pixelId: string,
    event: PixelEvent,
    accessToken?: string
  ): Promise<{ success: boolean; error?: string }>;
}
