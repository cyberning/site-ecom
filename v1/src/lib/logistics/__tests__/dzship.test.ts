import { describe, it, expect, vi, beforeEach } from "vitest";
import { DzshipProvider, testDzshipConnection } from "../providers/dzship";
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

const mockCredentials = { apiKey: "yal-key-123" };

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("DzshipProvider", () => {
  describe("createShipment", () => {
    it("mappe ShipmentRequest vers le payload dzship", async () => {
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

      const provider = new DzshipProvider({
        courier: "YALIDINE",
        credentials: mockCredentials,
      });
      const result = await provider.createShipment(mockShipmentRequest);

      expect(result.success).toBe(true);

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe("https://freeship.dzbuild.com/v1/orders");
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");

      const body = JSON.parse(options.body);
      expect(body.courier).toBe("YALIDINE");
      expect(body.credentials).toEqual(mockCredentials);
      expect(body.options).toEqual({});
      expect(body.order.reference).toBe("DZ-test123-ABC");
      expect(body.order.recipient.fullName).toBe("Ahmed Benali");
      expect(body.order.recipient.phone).toBe("0555123456");
      expect(body.order.recipient.wilayaCode).toBe(16);
      // Fallback : sans communeName, on envoie le code de commune
      expect(body.order.recipient.communeName).toBe("16001");
      expect(body.order.recipient.addressLine).toBe("123 Rue Principale, Alger");
      expect(body.order.deliveryType).toBe("home");
      expect(body.order.productList).toBe("T-shirt Premium x2");
      expect(body.order.codAmount).toBe(1500);
    });

    it("retourne ShipmentResponse avec providerTrackingId = trackingNumber", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          trackingNumber: "DZSHIP-001",
          status: "PENDING",
          reference: "DZ-test123-ABC",
        }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const provider = new DzshipProvider({
        courier: "YALIDINE",
        credentials: mockCredentials,
      });
      const result = await provider.createShipment(mockShipmentRequest);

      expect(result).toEqual({
        success: true,
        provider: "YALIDINE",
        providerTrackingId: "DZSHIP-001",
      });
    });

    it("utilise communeName quand fourni (dzship attend un nom, pas un code)", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ trackingNumber: "DZSHIP-004" }),
      };
      const fetchMock = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = fetchMock as unknown as typeof fetch;

      const provider = new DzshipProvider({
        courier: "YALIDINE",
        credentials: mockCredentials,
      });
      await provider.createShipment({
        ...mockShipmentRequest,
        communeName: "Bab Ezzouar",
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.order.recipient.communeName).toBe("Bab Ezzouar");
    });

    it("ajoute options.baseUrl quand fourni au constructeur", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ trackingNumber: "DZSHIP-002" }),
      };
      const fetchMock = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = fetchMock as unknown as typeof fetch;

      const provider = new DzshipProvider({
        courier: "ECOTRACK",
        credentials: { tenant: "eco-tenant" },
        baseUrl: "https://tenant.example.com",
      });
      await provider.createShipment(mockShipmentRequest);

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.options).toEqual({ baseUrl: "https://tenant.example.com" });
    });

    it("convertit STOP_DESK en stopdesk", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ trackingNumber: "DZSHIP-003" }),
      };
      const fetchMock = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = fetchMock as unknown as typeof fetch;

      const provider = new DzshipProvider({
        courier: "YALIDINE",
        credentials: mockCredentials,
      });
      await provider.createShipment({
        ...mockShipmentRequest,
        deliveryMode: "STOP_DESK",
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.order.deliveryType).toBe("stopdesk");
    });

    it("gère l'enveloppe d'erreur dzship { error: { code, message } }", async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: { code: "INVALID_CREDENTIALS", message: "Credentials invalides" },
        }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const provider = new DzshipProvider({
        courier: "YALIDINE",
        credentials: mockCredentials,
      });
      const result = await provider.createShipment(mockShipmentRequest);

      expect(result.success).toBe(false);
      expect(result.provider).toBe("YALIDINE");
      expect(result.error).toBe("Credentials invalides");
    });

    it("gère les erreurs réseau (fetch reject)", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Connection timeout"));

      const provider = new DzshipProvider({
        courier: "YALIDINE",
        credentials: mockCredentials,
      });
      const result = await provider.createShipment(mockShipmentRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Erreur réseau");
      expect(result.error).toContain("Connection timeout");
    });
  });

  describe("trackShipment", () => {
    it("mappe { status, events } vers TrackingResponse", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          status: "SHIPPED",
          events: [
            {
              status: "PENDING",
              location: "Alger",
              timestamp: "2026-08-25T10:00:00Z",
              description: "Commande créée",
            },
            {
              status: "SHIPPED",
              location: "Oran",
              timestamp: "2026-08-26T08:00:00Z",
              description: "Colis expédié",
            },
          ],
        }),
      };
      const fetchMock = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = fetchMock as unknown as typeof fetch;

      const provider = new DzshipProvider({
        courier: "YALIDINE",
        credentials: mockCredentials,
      });
      const result = await provider.trackShipment("DZ-test123-ABC");

      expect(result.success).toBe(true);
      expect(result.currentStatus).toBe("SHIPPED");
      expect(result.events).toHaveLength(2);
      expect(result.events[0]).toEqual({
        status: "PENDING",
        location: "Alger",
        timestamp: "2026-08-25T10:00:00Z",
        description: "Commande créée",
      });
      expect(result.events[1].status).toBe("SHIPPED");
      expect(result.events[1].location).toBe("Oran");

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe("https://freeship.dzbuild.com/v1/track");
      expect(options.method).toBe("POST");
      const body = JSON.parse(options.body);
      expect(body.courier).toBe("YALIDINE");
      expect(body.credentials).toEqual(mockCredentials);
      expect(body.trackingNumber).toBe("DZ-test123-ABC");
    });

    it("gère les erreurs dzship", async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: { code: "NOT_FOUND", message: "Colis introuvable" },
        }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const provider = new DzshipProvider({
        courier: "YALIDINE",
        credentials: mockCredentials,
      });
      const result = await provider.trackShipment("INVALID-ID");

      expect(result.success).toBe(false);
      expect(result.currentStatus).toBe("UNKNOWN");
      expect(result.events).toEqual([]);
      expect(result.error).toBe("Colis introuvable");
    });

    it("gère les erreurs réseau", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network down"));

      const provider = new DzshipProvider({
        courier: "YALIDINE",
        credentials: mockCredentials,
      });
      const result = await provider.trackShipment("DZ-test123-ABC");

      expect(result.success).toBe(false);
      expect(result.currentStatus).toBe("UNKNOWN");
      expect(result.events).toEqual([]);
      expect(result.error).toContain("Erreur réseau");
    });
  });

  describe("cancelShipment", () => {
    it("retourne non supporté sans appeler fetch", async () => {
      const fetchMock = vi.fn();
      global.fetch = fetchMock as unknown as typeof fetch;

      const provider = new DzshipProvider({
        courier: "YALIDINE",
        credentials: mockCredentials,
      });
      const result = await provider.cancelShipment("DZ-test123-ABC");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Annulation non supportée par ce transporteur");
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});

describe("testDzshipConnection", () => {
  it("appelle POST /v1/rates avec le bon body et retourne success", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ rates: [] }),
    };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await testDzshipConnection("YALIDINE", mockCredentials);

    expect(result).toEqual({ success: true });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://freeship.dzbuild.com/v1/rates");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body.courier).toBe("YALIDINE");
    expect(body.credentials).toEqual(mockCredentials);
    expect(body.options).toEqual({});
    expect(body.query).toEqual({
      fromWilaya: 16,
      toWilaya: 16,
      toCommune: "Alger",
      deliveryType: "home",
    });
  });

  it("ajoute options.baseUrl quand fourni", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ rates: [] }),
    };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock as unknown as typeof fetch;

    await testDzshipConnection("ECOTRACK", { tenant: "eco-tenant" }, "https://tenant.example.com");

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.options).toEqual({ baseUrl: "https://tenant.example.com" });
  });

  it("utilise fromWilaya fourni dans le query (défaut 16)", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ rates: [] }),
    };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock as unknown as typeof fetch;

    await testDzshipConnection("YALIDINE", mockCredentials, undefined, 31);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.query.fromWilaya).toBe(31);
  });

  it("retourne success false avec le message dzship en cas d'erreur", async () => {
    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({
        error: { code: "BAD_CREDENTIALS", message: "Identifiants invalides" },
      }),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await testDzshipConnection("YALIDINE", mockCredentials);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Identifiants invalides");
  });

  it("gère les erreurs réseau", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network down"));

    const result = await testDzshipConnection("YALIDINE", mockCredentials);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Erreur réseau");
    expect(result.error).toContain("Network down");
  });
});
