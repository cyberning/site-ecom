/**
 * TikTok Events API — envoi server-side d'événements
 * pour le suivi des conversions TikTok Ads.
 *
 * Documentation : https://business-api.tiktok.com/portal/docs?id=1739593083610113
 */

import { PixelProvider, PixelEvent } from "../types";

const TIKTOK_API_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

export class TikTokPixelProvider implements PixelProvider {
  readonly name = "TikTok Ads";
  readonly code = "TIKTOK";

  async sendEvent(
    pixelId: string,
    event: PixelEvent,
    accessToken?: string
  ): Promise<{ success: boolean; error?: string }> {
    const token = accessToken || process.env.TIKTOK_ACCESS_TOKEN;

    if (!token) {
      // Démo : pas de token configuré, on simule un succès
      return { success: true };
    }

    const payload = {
      pixel_code: pixelId,
      event: event.eventName,
      event_id: event.eventId,
      timestamp: new Date(event.timestamp * 1000).toISOString(),
      context: {
        user_agent: event.userData.userAgent,
        ip: event.userData.ip,
        page: { url: (event.customData?.pageUrl as string) || "" },
      },
      properties: {
        value: event.customData?.value,
        currency: event.customData?.currency || "DZD",
        content_type: event.customData?.contentType,
        description: event.customData?.description,
      },
    };

    try {
      const response = await fetch(`${TIKTOK_API_URL}?access_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.code !== 0) return { success: false, error: data.message || "Erreur TikTok" };
      return { success: true };
    } catch (error) {
      return { success: false, error: `Erreur réseau: ${error}` };
    }
  }
}
