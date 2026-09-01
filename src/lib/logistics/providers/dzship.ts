import type {
  LogisticProvider,
  ShipmentRequest,
  ShipmentResponse,
  TrackingResponse,
} from "../types";

// ============================================
// Provider dzship — agrégateur de transporteurs algériens
// (Yalidine, ZR Express, Maystro, NOEST, Zimou, DHD, Ecotrack…)
// API stateless : les credentials du transporteur sont envoyés à CHAQUE appel.
// Docs : https://freeship.dzbuild.com/v1
// ============================================

const DZSHIP_API_URL = "https://freeship.dzbuild.com/v1";

export interface DzshipProviderConfig {
  courier: string;
  credentials: Record<string, string>;
  baseUrl?: string;
}

interface DzshipErrorEnvelope {
  error?: { code?: string; message?: string };
}

/** Extrait le message de l'enveloppe d'erreur dzship `{ error: { code, message } }`. */
function extractDzshipError(data: unknown): string | undefined {
  if (data && typeof data === "object" && "error" in data) {
    const err = (data as DzshipErrorEnvelope).error;
    if (err?.message) return err.message;
  }
  return undefined;
}

export class DzshipProvider implements LogisticProvider {
  readonly name: string;
  readonly code: string;

  private courier: string;
  private credentials: Record<string, string>;
  private baseUrl?: string;

  constructor(config: DzshipProviderConfig) {
    this.courier = config.courier;
    this.credentials = config.credentials;
    this.baseUrl = config.baseUrl;
    this.name = config.courier;
    this.code = config.courier.toUpperCase();
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    try {
      // Certains transporteurs (ex. Ecotrack) exigent le tenant via options.baseUrl
      const options: Record<string, unknown> = {};
      if (this.baseUrl) options.baseUrl = this.baseUrl;

      const response = await fetch(`${DZSHIP_API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Timeout 10s : évite qu'un appel bloqué ne fige la requête (le catch gère le TimeoutError)
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
          courier: this.courier,
          credentials: this.credentials,
          options,
          order: {
            reference: request.trackingId,
            recipient: {
              fullName: request.customerName,
              phone: request.customerPhone,
              wilayaCode: Number(request.wilayaCode),
              // dzship attend un NOM de commune : on préfère communeName, fallback sur le code
              communeName: request.communeName ?? request.communeCode,
              addressLine: request.address,
            },
            deliveryType: request.deliveryMode === "HOME" ? "home" : "stopdesk",
            productList: request.items.map((i) => `${i.name} x${i.quantity}`).join(", "),
            codAmount: request.totalAmount,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          provider: this.code,
          error: extractDzshipError(data) ?? `Erreur dzship (HTTP ${response.status})`,
        };
      }

      return {
        success: true,
        provider: this.code,
        providerTrackingId: data.trackingNumber,
      };
    } catch (error) {
      return { success: false, provider: this.code, error: `Erreur réseau: ${error}` };
    }
  }

  async trackShipment(trackingId: string): Promise<TrackingResponse> {
    try {
      const response = await fetch(`${DZSHIP_API_URL}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Timeout 10s : évite qu'un appel bloqué ne fige la requête (le catch gère le TimeoutError)
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
          courier: this.courier,
          credentials: this.credentials,
          trackingNumber: trackingId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          events: [],
          currentStatus: "UNKNOWN",
          error: extractDzshipError(data) ?? `Erreur dzship (HTTP ${response.status})`,
        };
      }

      return {
        success: true,
        events: (Array.isArray(data.events) ? data.events : []).map(
          (e: {
            status?: string;
            location?: string;
            timestamp?: string;
            description?: string;
          }) => ({
            status: e.status ?? "UNKNOWN",
            location: e.location,
            timestamp: e.timestamp ?? new Date().toISOString(),
            description: e.description ?? "",
          })
        ),
        currentStatus: data.status ?? "UNKNOWN",
      };
    } catch (error) {
      return {
        success: false,
        events: [],
        currentStatus: "UNKNOWN",
        error: `Erreur réseau: ${error}`,
      };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- paramètre requis par l'interface LogisticProvider
  async cancelShipment(_trackingId: string): Promise<{ success: boolean; error?: string }> {
    // dzship ne documente aucun endpoint d'annulation.
    // On retourne proprement "non supporté" plutôt que d'inventer un appel.
    return { success: false, error: "Annulation non supportée par ce transporteur" };
  }
}

/**
 * Teste une connexion transporteur via l'endpoint le plus léger de dzship (/v1/rates).
 * Des credentials invalides → erreur. Ne sauvegarde rien.
 */
export async function testDzshipConnection(
  courier: string,
  credentials: Record<string, string>,
  baseUrl?: string,
  fromWilaya: number = 16
): Promise<{ success: boolean; error?: string }> {
  try {
    const options: Record<string, unknown> = {};
    if (baseUrl) options.baseUrl = baseUrl;

    const response = await fetch(`${DZSHIP_API_URL}/rates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Timeout 10s : évite qu'un appel bloqué ne fige la requête (le catch gère le TimeoutError)
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        courier,
        credentials,
        options,
        query: {
          fromWilaya,
          toWilaya: 16,
          toCommune: "Alger",
          deliveryType: "home",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: extractDzshipError(data) ?? `Erreur dzship (HTTP ${response.status})`,
      };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: `Erreur réseau: ${error}` };
  }
}
