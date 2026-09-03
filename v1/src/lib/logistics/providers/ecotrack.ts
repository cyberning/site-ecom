import type {
  LogisticProvider,
  ShipmentRequest,
  ShipmentResponse,
  TrackingResponse,
} from "../types";

const ECOTRACK_API_URL = "https://api.ecotrack.dz/api/v1";

export class EcotrackProvider implements LogisticProvider {
  readonly name = "Ecotrack";
  readonly code = "ECOTRACK";

  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ECOTRACK_API_KEY || "";
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    if (!this.apiKey) {
      // Mode démo — simule une réponse succès
      // Démo : pas de clé API, on simule un envoi réussi
      return {
        success: true,
        provider: this.code,
        providerTrackingId: `ECO-${request.trackingId}`,
        estimatedDelivery: new Date(Date.now() + 3 * 86400000).toISOString(),
      };
    }

    try {
      const response = await fetch(`${ECOTRACK_API_URL}/shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          reference: request.trackingId,
          recipient_name: request.customerName,
          recipient_phone: request.customerPhone,
          recipient_address: request.address,
          wilaya_code: request.wilayaCode,
          commune_code: request.communeCode,
          delivery_type: request.deliveryMode === "HOME" ? "domicile" : "stopdesk",
          cod_amount: request.totalAmount,
          items: request.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, provider: this.code, error: data.message || "Erreur Ecotrack" };
      }

      return {
        success: true,
        provider: this.code,
        providerTrackingId: data.tracking_number,
        estimatedDelivery: data.estimated_delivery,
        labelUrl: data.label_url,
      };
    } catch (error) {
      return { success: false, provider: this.code, error: `Erreur réseau: ${error}` };
    }
  }

  async trackShipment(trackingId: string): Promise<TrackingResponse> {
    if (!this.apiKey) {
      return {
        success: true,
        events: [
          {
            status: "PENDING",
            timestamp: new Date().toISOString(),
            description: "En attente de prise en charge",
          },
        ],
        currentStatus: "PENDING",
      };
    }

    try {
      const response = await fetch(`${ECOTRACK_API_URL}/tracking/${trackingId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      const data = await response.json();

      if (!response.ok) {
        return { success: false, events: [], currentStatus: "UNKNOWN", error: data.message };
      }

      return {
        success: true,
        events:
          data.events?.map(
            (e: { status: string; location?: string; timestamp: string; description: string }) => ({
              status: e.status,
              location: e.location,
              timestamp: e.timestamp,
              description: e.description,
            })
          ) || [],
        currentStatus: data.current_status || "UNKNOWN",
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

  async cancelShipment(trackingId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKey) {
      return { success: true };
    }

    try {
      const response = await fetch(`${ECOTRACK_API_URL}/shipments/${trackingId}/cancel`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.ok ? { success: true } : { success: false, error: "Annulation refusée" };
    } catch (error) {
      return { success: false, error: `Erreur réseau: ${error}` };
    }
  }
}
