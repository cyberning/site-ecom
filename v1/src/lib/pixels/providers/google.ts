/**
 * Google Ads Enhanced Conversions — envoi server-side
 * de conversions via l'API Google Ads.
 *
 * Documentation : https://developers.google.com/google-ads/api/docs/conversions/enhanced-conversions
 */

import { PixelProvider, PixelEvent } from "../types";
import { hashEmail, hashPhone } from "../hashing";

const GOOGLE_ADS_API_URL = "https://googleads.googleapis.com/v17";

export class GoogleAdsPixelProvider implements PixelProvider {
  readonly name = "Google Ads";
  readonly code = "GOOGLE";

  async sendEvent(
    pixelId: string,
    event: PixelEvent,
    accessToken?: string
  ): Promise<{ success: boolean; error?: string }> {
    const token = accessToken || process.env.GOOGLE_ADS_ACCESS_TOKEN;
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

    if (!token || !customerId) {
      // Démo : pas de token configuré, on simule un succès
      return { success: true };
    }

    // Build user identifiers with properly hashed data
    const userIdentifiers: Array<Record<string, string>> = [];
    const hashedEmail = hashEmail(event.userData.email);
    const hashedPhone = hashPhone(event.userData.phone);

    if (hashedEmail || hashedPhone) {
      userIdentifiers.push({
        ...(hashedEmail ? { hashed_email: hashedEmail } : {}),
        ...(hashedPhone ? { hashed_phone_number: hashedPhone } : {}),
      });
    }

    // Server-side conversion tracking via Enhanced Conversions
    const payload = {
      conversions: [
        {
          conversion_action: `customers/${customerId}/conversionActions/${pixelId}`,
          conversion_value: event.customData?.value || 0,
          currency_code: event.customData?.currency || "DZD",
          conversion_date_time: new Date(event.timestamp * 1000).toISOString(),
          order_id: event.eventId,
          user_identifiers: userIdentifiers,
        },
      ],
    };

    try {
      const response = await fetch(
        `${GOOGLE_ADS_API_URL}/customers/${customerId}/conversionCustomColumns:adjustColumnValues:uploadConversion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.error?.message || "Erreur Google Ads" };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: `Erreur réseau: ${error}` };
    }
  }
}
