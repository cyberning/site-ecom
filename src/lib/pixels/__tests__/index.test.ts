import { describe, it, expect, vi, beforeEach } from "vitest";
import { MetaPixelProvider } from "../providers/meta";
import { TikTokPixelProvider } from "../providers/tiktok";
import { GoogleAdsPixelProvider } from "../providers/google";
import { fireConversionEvent, fireAllActivePixels } from "../index";
import type { PixelEvent } from "../types";

const mockEvent: PixelEvent = {
  eventName: "Purchase",
  eventId: "evt-001",
  timestamp: Date.now(),
  userData: {
    externalId: "order-123",
    email: "test@example.com",
    phone: "0555123456",
  },
  customData: {
    value: 1500,
    currency: "DZD",
  },
};

// Sauvegarde les env vars originales
const originalEnv = { ...process.env };

beforeEach(() => {
  vi.restoreAllMocks();
  // Reset les env vars pixel
  delete process.env.META_CAPI_ACCESS_TOKEN;
  delete process.env.TIKTOK_ACCESS_TOKEN;
  delete process.env.GOOGLE_ADS_ACCESS_TOKEN;
  delete process.env.GOOGLE_ADS_CUSTOMER_ID;
  process.env = { ...originalEnv };
});

describe("MetaPixelProvider", () => {
  it("succès en mode démo (pas de token)", async () => {
    const provider = new MetaPixelProvider();
    const result = await provider.sendEvent("123456", mockEvent);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("retourne les bonnes propriétés", () => {
    const provider = new MetaPixelProvider();
    expect(provider.name).toBe("Meta (Facebook Ads)");
    expect(provider.code).toBe("META");
  });

  it("appelle fetch avec le bon payload en mode réel", async () => {
    process.env.META_CAPI_ACCESS_TOKEN = "test-token";

    const mockResponse = { json: vi.fn().mockResolvedValue({}) };
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = mockFetch;

    const provider = new MetaPixelProvider();
    await provider.sendEvent("pixel-123", mockEvent);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("pixel-123/events");
    expect(url).toContain("access_token=test-token");
    expect(options.method).toBe("POST");

    // Nettoyage
    delete process.env.META_CAPI_ACCESS_TOKEN;
  });

  it("gère les erreurs de l'API Meta", async () => {
    process.env.META_CAPI_ACCESS_TOKEN = "test-token";

    const mockResponse = {
      json: vi.fn().mockResolvedValue({
        error: { message: "Invalid access token" },
      }),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const provider = new MetaPixelProvider();
    const result = await provider.sendEvent("pixel-123", mockEvent);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid access token");

    delete process.env.META_CAPI_ACCESS_TOKEN;
  });

  it("gère les erreurs réseau", async () => {
    process.env.META_CAPI_ACCESS_TOKEN = "test-token";
    global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

    const provider = new MetaPixelProvider();
    const result = await provider.sendEvent("pixel-123", mockEvent);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Network failure");

    delete process.env.META_CAPI_ACCESS_TOKEN;
  });

  it("utilise le token passé en paramètre优先 sur env", async () => {
    process.env.META_CAPI_ACCESS_TOKEN = "env-token";
    const mockResponse = { json: vi.fn().mockResolvedValue({}) };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new MetaPixelProvider();
    await provider.sendEvent("pixel-123", mockEvent, "param-token");

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("access_token=param-token");

    delete process.env.META_CAPI_ACCESS_TOKEN;
  });
});

describe("TikTokPixelProvider", () => {
  it("succès en mode démo (pas de token)", async () => {
    const provider = new TikTokPixelProvider();
    const result = await provider.sendEvent("PIX", mockEvent);
    expect(result.success).toBe(true);
  });

  it("retourne les bonnes propriétés", () => {
    const provider = new TikTokPixelProvider();
    expect(provider.name).toBe("TikTok Ads");
    expect(provider.code).toBe("TIKTOK");
  });

  it("appelle fetch avec le bon payload en mode réel", async () => {
    process.env.TIKTOK_ACCESS_TOKEN = "tiktok-token";

    const mockResponse = {
      json: vi.fn().mockResolvedValue({ code: 0, message: "OK" }),
    };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new TikTokPixelProvider();
    await provider.sendEvent("tiktok-pixel", mockEvent);

    expect(global.fetch).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("access_token=tiktok-token");
    expect(options.method).toBe("POST");

    delete process.env.TIKTOK_ACCESS_TOKEN;
  });

  it("gère les erreurs de l'API TikTok", async () => {
    process.env.TIKTOK_ACCESS_TOKEN = "tiktok-token";

    const mockResponse = {
      json: vi.fn().mockResolvedValue({ code: 401, message: "Unauthorized" }),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const provider = new TikTokPixelProvider();
    const result = await provider.sendEvent("tiktok-pixel", mockEvent);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");

    delete process.env.TIKTOK_ACCESS_TOKEN;
  });
});

describe("GoogleAdsPixelProvider", () => {
  it("succès en mode démo (pas de token)", async () => {
    const provider = new GoogleAdsPixelProvider();
    const result = await provider.sendEvent("123", mockEvent);
    expect(result.success).toBe(true);
  });

  it("retourne les bonnes propriétés", () => {
    const provider = new GoogleAdsPixelProvider();
    expect(provider.name).toBe("Google Ads");
    expect(provider.code).toBe("GOOGLE");
  });

  it("appelle fetch en mode réel avec token et customerId", async () => {
    process.env.GOOGLE_ADS_ACCESS_TOKEN = "google-token";
    process.env.GOOGLE_ADS_CUSTOMER_ID = "123-456-7890";

    const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({}) };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const provider = new GoogleAdsPixelProvider();
    await provider.sendEvent("conv-action", mockEvent);

    expect(global.fetch).toHaveBeenCalledOnce();

    delete process.env.GOOGLE_ADS_ACCESS_TOKEN;
    delete process.env.GOOGLE_ADS_CUSTOMER_ID;
  });

  it("gère les erreurs HTTP", async () => {
    process.env.GOOGLE_ADS_ACCESS_TOKEN = "google-token";
    process.env.GOOGLE_ADS_CUSTOMER_ID = "123-456-7890";

    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({
        error: { message: "Invalid conversion action" },
      }),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const provider = new GoogleAdsPixelProvider();
    const result = await provider.sendEvent("bad-action", mockEvent);

    expect(result.success).toBe(false);

    delete process.env.GOOGLE_ADS_ACCESS_TOKEN;
    delete process.env.GOOGLE_ADS_CUSTOMER_ID;
  });
});

describe("fireConversionEvent", () => {
  it("retourne succès en mode démo", async () => {
    const result = await fireConversionEvent("pixel-id", "META", mockEvent);
    expect(result.success).toBe(true);
  });

  it("gère les providers inconnus", async () => {
    const result = await fireConversionEvent("pixel-id", "UNKNOWN", mockEvent);
    expect(result.success).toBe(false);
    expect(result.error).toContain("inconnu");
  });

  it("gère les erreurs réseau sans crash", async () => {
    process.env.META_CAPI_ACCESS_TOKEN = "token";
    global.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

    const result = await fireConversionEvent("pixel-id", "META", mockEvent);
    expect(result.success).toBe(false);

    delete process.env.META_CAPI_ACCESS_TOKEN;
  });
});

describe("fireAllActivePixels", () => {
  it("retourne 0 quand aucun pixel actif", async () => {
    // Mock Prisma pour retourner une liste vide
    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        pixel: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    }));

    const { fireAllActivePixels: freshFire } = await import("../index");
    const result = await freshFire(mockEvent);

    expect(result.total).toBe(0);
    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(0);

    vi.unmock("@/lib/prisma");
  });
});
