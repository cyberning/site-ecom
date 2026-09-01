import { describe, it, expect, vi, beforeEach } from "vitest";
import { EcotrackProvider } from "../providers/ecotrack";
import { createShipment, trackShipment, cancelShipment, createShipmentForCourier } from "../index";
import type { ShipmentRequest } from "../types";

const mockShipmentRequest: ShipmentRequest = {
  orderId: "order-001",
  trackingId: "DZ-test123-ABC",
  customerName: "Ahmed Benali",
  customerPhone: "0555123456",
  address: "123 Rue Principale, Alger",
  wilayaCode: "16",
  communeCode: "16001",
  deliveryMode: "HOME",
  totalAmount: 1500,
  items: [{ name: "T-shirt Premium", quantity: 2, price: 1500 }],
};

// Sauvegarde les env vars originales
const originalEnv = { ...process.env };

beforeEach(() => {
  vi.restoreAllMocks();
  delete process.env.ECOTRACK_API_KEY;
  process.env = { ...originalEnv };
});

describe("EcotrackProvider", () => {
  describe("createShipment", () => {
    it("succès en mode démo (pas de clé API)", async () => {
      const provider = new EcotrackProvider();
      const result = await provider.createShipment(mockShipmentRequest);

      expect(result.success).toBe(true);
      expect(result.provider).toBe("ECOTRACK");
      expect(result.providerTrackingId).toContain("DZ-test123-ABC");
      expect(result.estimatedDelivery).toBeDefined();
      expect(result.labelUrl).toBeUndefined();
    });

    it("retourne les bonnes propriétés", () => {
      const provider = new EcotrackProvider();
      expect(provider.name).toBe("Ecotrack");
      expect(provider.code).toBe("ECOTRACK");
    });

    it("appelle fetch avec le bon payload en mode réel", async () => {
      process.env.ECOTRACK_API_KEY = "eco-key-123";

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          tracking_number: "ECO-TRACK-001",
          estimated_delivery: "2026-09-01T00:00:00Z",
          label_url: "https://example.com/label.pdf",
        }),
      };
      const fetchMock = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = fetchMock as unknown as typeof fetch;

      const provider = new EcotrackProvider();
      const result = await provider.createShipment(mockShipmentRequest);

      expect(result.success).toBe(true);
      expect(result.providerTrackingId).toBe("ECO-TRACK-001");
      expect(result.labelUrl).toBe("https://example.com/label.pdf");
      expect(global.fetch).toHaveBeenCalledOnce();

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain("/shipments");
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBe("Bearer eco-key-123");

      const body = JSON.parse(options.body);
      expect(body.reference).toBe("DZ-test123-ABC");
      expect(body.recipient_name).toBe("Ahmed Benali");
      expect(body.delivery_type).toBe("domicile");

      delete process.env.ECOTRACK_API_KEY;
    });

    it("gère les erreurs HTTP", async () => {
      process.env.ECOTRACK_API_KEY = "eco-key-123";

      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({ message: "Invalid address" }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const provider = new EcotrackProvider();
      const result = await provider.createShipment(mockShipmentRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid address");

      delete process.env.ECOTRACK_API_KEY;
    });

    it("gère les erreurs réseau", async () => {
      process.env.ECOTRACK_API_KEY = "eco-key-123";
      global.fetch = vi.fn().mockRejectedValue(new Error("Connection timeout"));

      const provider = new EcotrackProvider();
      const result = await provider.createShipment(mockShipmentRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Connection timeout");

      delete process.env.ECOTRACK_API_KEY;
    });

    it("convertit STOP_DESK en stopdesk", async () => {
      process.env.ECOTRACK_API_KEY = "eco-key-123";

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ tracking_number: "ECO-002" }),
      };
      const fetchMock = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = fetchMock as unknown as typeof fetch;

      const provider = new EcotrackProvider();
      await provider.createShipment({
        ...mockShipmentRequest,
        deliveryMode: "STOP_DESK",
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.delivery_type).toBe("stopdesk");

      delete process.env.ECOTRACK_API_KEY;
    });
  });

  describe("trackShipment", () => {
    it("succès en mode démo", async () => {
      const provider = new EcotrackProvider();
      const result = await provider.trackShipment("DZ-test123-ABC");

      expect(result.success).toBe(true);
      expect(result.currentStatus).toBe("PENDING");
      expect(result.events).toHaveLength(1);
      expect(result.events[0].status).toBe("PENDING");
      expect(result.events[0].description).toContain("attente");
    });

    it("appelle fetch en mode réel", async () => {
      process.env.ECOTRACK_API_KEY = "eco-key-123";

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          current_status: "SHIPPED",
          events: [
            {
              status: "PENDING",
              timestamp: "2026-08-25T10:00:00Z",
              description: "Commande créée",
            },
            {
              status: "SHIPPED",
              location: "Alger",
              timestamp: "2026-08-26T08:00:00Z",
              description: "Colis expédié",
            },
          ],
        }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const provider = new EcotrackProvider();
      const result = await provider.trackShipment("DZ-test123-ABC");

      expect(result.success).toBe(true);
      expect(result.currentStatus).toBe("SHIPPED");
      expect(result.events).toHaveLength(2);
      expect(result.events[1].location).toBe("Alger");

      delete process.env.ECOTRACK_API_KEY;
    });

    it("gère les erreurs de tracking", async () => {
      process.env.ECOTRACK_API_KEY = "eco-key-123";

      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({ message: "Tracking not found" }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const provider = new EcotrackProvider();
      const result = await provider.trackShipment("INVALID-ID");

      expect(result.success).toBe(false);
      expect(result.currentStatus).toBe("UNKNOWN");

      delete process.env.ECOTRACK_API_KEY;
    });
  });

  describe("cancelShipment", () => {
    it("succès en mode démo", async () => {
      const provider = new EcotrackProvider();
      const result = await provider.cancelShipment("DZ-test123-ABC");
      expect(result.success).toBe(true);
    });

    it("appelle fetch en mode réel", async () => {
      process.env.ECOTRACK_API_KEY = "eco-key-123";

      const mockResponse = { ok: true };
      const fetchMock = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = fetchMock as unknown as typeof fetch;

      const provider = new EcotrackProvider();
      const result = await provider.cancelShipment("DZ-test123-ABC");

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledOnce();
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain("/cancel");
      expect(options.method).toBe("DELETE");

      delete process.env.ECOTRACK_API_KEY;
    });

    it("gère l'annulation refusée", async () => {
      process.env.ECOTRACK_API_KEY = "eco-key-123";

      const mockResponse = { ok: false };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const provider = new EcotrackProvider();
      const result = await provider.cancelShipment("DZ-test123-ABC");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Annulation refusée");

      delete process.env.ECOTRACK_API_KEY;
    });
  });
});

describe("Dispatcher logistique (index)", () => {
  it("createShipment avec provider ECOTRACK", async () => {
    const result = await createShipment("ECOTRACK", mockShipmentRequest);
    expect(result.success).toBe(true);
    expect(result.provider).toBe("ECOTRACK");
  });

  it("trackShipment avec provider ECOTRACK", async () => {
    const result = await trackShipment("ECOTRACK", "DZ-test123-ABC");
    expect(result.success).toBe(true);
    expect(result.currentStatus).toBe("PENDING");
  });

  it("cancelShipment avec provider ECOTRACK", async () => {
    const result = await cancelShipment("ECOTRACK", "DZ-test123-ABC");
    expect(result.success).toBe(true);
  });

  it("lance une erreur pour un provider inconnu", () => {
    expect(() => createShipment("UNKNOWN", mockShipmentRequest)).toThrow(
      "Provider logistique inconnu"
    );
  });

  it("la casse du code provider est insensible", async () => {
    const result = await createShipment("ecotrack", mockShipmentRequest);
    expect(result.success).toBe(true);
  });

  it("createShipmentForCourier envoie vers dzship /v1/orders avec courier et credentials", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        trackingNumber: "DZSHIP-001",
        status: "PENDING",
        reference: "DZ-test123-ABC",
      }),
    };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await createShipmentForCourier(
      "YALIDINE",
      { apiKey: "yal-key-123" },
      mockShipmentRequest
    );

    expect(result.success).toBe(true);
    expect(result.provider).toBe("YALIDINE");
    expect(result.providerTrackingId).toBe("DZSHIP-001");

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://freeship.dzbuild.com/v1/orders");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body.courier).toBe("YALIDINE");
    expect(body.credentials).toEqual({ apiKey: "yal-key-123" });
    expect(body.order.reference).toBe("DZ-test123-ABC");
  });
});
