/**
 * Meta Conversions API (CAPI) — envoi server-side d'événements
 * vers l'API Graph Facebook pour le suivi des conversions.
 *
 * Documentation : https://developers.facebook.com/docs/marketing-api/conversions-api/
 */

import { PixelProvider, PixelEvent } from "../types";
import { hashEmail, hashPhone } from "../hashing";

const META_API_VERSION = "v19.0";
const META_API_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export class MetaPixelProvider implements PixelProvider {
  readonly name = "Meta (Facebook Ads)";
  readonly code = "META";

  async sendEvent(
    pixelId: string,
    event: PixelEvent,
    accessToken?: string
  ): Promise<{ success: boolean; error?: string }> {
    const token = accessToken || process.env.META_CAPI_ACCESS_TOKEN;

    if (!token) {
      // Démo : pas de token configuré, on simule un succès
      return { success: true };
    }

    const payload = {
      data: [
        {
          event_name: event.eventName,
          event_time: event.timestamp,
          event_id: event.eventId,
          action_source: "website",
          user_data: {
            external_id: event.userData.externalId,
            em: event.userData.email ? [hashEmail(event.userData.email)] : undefined,
            ph: event.userData.phone ? [hashPhone(event.userData.phone)] : undefined,
            client_ip_address: event.userData.ip,
            client_user_agent: event.userData.userAgent,
          },
          custom_data: event.customData,
        },
      ],
    };

    try {
      const response = await fetch(`${META_API_URL}/${pixelId}/events?access_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.error) return { success: false, error: data.error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: `Erreur réseau: ${error}` };
    }
  }
}
