import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { NextRequest } from "next/server";
import type { DeliveryConnection } from "@/lib/delivery/connections";

// Mocks des dépendances externes (hoisted par Vitest)
vi.mock("@/lib/prisma", () => ({
  prisma: {
    deliveryMatrix: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/delivery/connections", () => ({
  getConnections: vi.fn(),
}));

// Silence console.error pendant les tests (repli matrice / dzship down)
vi.spyOn(console, "error").mockImplementation(() => {});

const baseConn: DeliveryConnection = {
  code: "YALIDINE",
  name: "Yalidine",
  platform: "dzship",
  credentials: { apiKey: "secret-key" },
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/delivery/calculate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Matrice wilaya active par défaut (Oran, wilaya 31). */
function makeMatrix(overrides: Record<string, unknown> = {}) {
  return {
    id: "matrix-1",
    wilayaCode: "31",
    wilayaName: "Oran",
    homeFee: 800,
    stopDeskFee: 500,
    estimatedDays: 3,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

/** Réponse dzship /v1/rates réussie par défaut. */
function makeDzshipResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    json: async () => ({ deliveryFee: 700, estimatedDays: 3, ...overrides }),
  };
}

// Références re-importées à chaque beforeEach (vi.resetModules() vide le cache
// module de la route, notamment `ratesCache` : cache frais à chaque test).
let mockedGetConnections: Mock;
let mockedFindUnique: Mock;
let POST: typeof import("../route").POST;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.unstubAllGlobals();

  const prismaModule = await import("@/lib/prisma");
  const connectionsModule = await import("@/lib/delivery/connections");
  const routeModule = await import("../route");

  mockedFindUnique = vi.mocked(prismaModule.prisma.deliveryMatrix.findUnique);
  mockedGetConnections = vi.mocked(connectionsModule.getConnections);
  POST = routeModule.POST;

  // Valeurs par défaut des mocks
  mockedGetConnections.mockResolvedValue([baseConn]);
  mockedFindUnique.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/delivery/calculate", () => {
  describe("validation", () => {
    it("retourne 400 si wilayaCode est manquant", async () => {
      const res = await POST(makeRequest({ deliveryMode: "HOME" }));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "Code wilaya requis" });
      expect(mockedGetConnections).not.toHaveBeenCalled();
      expect(mockedFindUnique).not.toHaveBeenCalled();
    });
  });

  describe("repli matrice", () => {
    it("retourne homeFee quand aucune connexion active (HOME)", async () => {
      mockedGetConnections.mockResolvedValue([]);
      mockedFindUnique.mockResolvedValue(makeMatrix());

      const res = await POST(makeRequest({ wilayaCode: "31", deliveryMode: "HOME" }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ fee: 800, estimatedDays: 3 });
      expect(mockedFindUnique).toHaveBeenCalledWith({ where: { wilayaCode: "31" } });
    });

    it("retourne stopDeskFee quand aucune connexion active (STOP_DESK)", async () => {
      mockedGetConnections.mockResolvedValue([]);
      mockedFindUnique.mockResolvedValue(makeMatrix());

      const res = await POST(makeRequest({ wilayaCode: "31", deliveryMode: "STOP_DESK" }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ fee: 500, estimatedDays: 3 });
    });

    it("retourne { fee: 0, estimatedDays: 2 } quand la matrice est absente", async () => {
      mockedGetConnections.mockResolvedValue([]);
      mockedFindUnique.mockResolvedValue(null);

      const res = await POST(makeRequest({ wilayaCode: "31", deliveryMode: "HOME" }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ fee: 0, estimatedDays: 2 });
    });

    it("retourne { fee: 0, estimatedDays: 2 } quand la matrice est inactive", async () => {
      mockedGetConnections.mockResolvedValue([]);
      mockedFindUnique.mockResolvedValue(makeMatrix({ isActive: false }));

      const res = await POST(makeRequest({ wilayaCode: "31", deliveryMode: "HOME" }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ fee: 0, estimatedDays: 2 });
    });

    it("retourne le fee matrice quand wilayaCode est non numérique", async () => {
      mockedFindUnique.mockResolvedValue(makeMatrix());

      const res = await POST(makeRequest({ wilayaCode: "abc", deliveryMode: "HOME" }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ fee: 800, estimatedDays: 3 });
      // dzship ininterrogeable : getConnections n'est même pas appelé
      expect(mockedGetConnections).not.toHaveBeenCalled();
      expect(mockedFindUnique).toHaveBeenCalledWith({ where: { wilayaCode: "abc" } });
    });
  });

  describe("succès dzship", () => {
    it("retourne fee/estimatedDays de dzship et envoie le bon body (HOME)", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeDzshipResponse());
      vi.stubGlobal("fetch", fetchMock);

      const res = await POST(makeRequest({ wilayaCode: "31", deliveryMode: "HOME" }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ fee: 700, estimatedDays: 3 });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://freeship.dzbuild.com/v1/rates");
      const body = JSON.parse(init.body as string);
      expect(body.courier).toBe("YALIDINE");
      expect(body.credentials).toEqual({ apiKey: "secret-key" });
      expect(body.query.fromWilaya).toBe(16); // défaut quand fromWilaya absent
      expect(body.query.toWilaya).toBe(31); // parseInt(wilayaCode)
      expect(body.query.deliveryType).toBe("home");
      expect(body.query.toCommune).toBeUndefined();
    });

    it("envoie deliveryType 'stopdesk' pour STOP_DESK", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeDzshipResponse());
      vi.stubGlobal("fetch", fetchMock);

      await POST(makeRequest({ wilayaCode: "31", deliveryMode: "STOP_DESK" }));

      const [, init] = fetchMock.mock.calls[0];
      const body = JSON.parse(init.body as string);
      expect(body.query.deliveryType).toBe("stopdesk");
    });

    it("utilise fromWilaya et baseUrl de la connexion personnalisée", async () => {
      mockedGetConnections.mockResolvedValue([
        { ...baseConn, fromWilaya: 30, baseUrl: "https://x.ecotrack.dz" },
      ]);
      const fetchMock = vi.fn().mockResolvedValue(makeDzshipResponse());
      vi.stubGlobal("fetch", fetchMock);

      await POST(makeRequest({ wilayaCode: "31", deliveryMode: "HOME" }));

      const [, init] = fetchMock.mock.calls[0];
      const body = JSON.parse(init.body as string);
      expect(body.query.fromWilaya).toBe(30);
      expect(body.options.baseUrl).toBe("https://x.ecotrack.dz");
    });

    it("envoie toCommune quand communeName est fourni", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeDzshipResponse());
      vi.stubGlobal("fetch", fetchMock);

      await POST(makeRequest({ wilayaCode: "31", deliveryMode: "HOME", communeName: "Oran" }));

      const [, init] = fetchMock.mock.calls[0];
      const body = JSON.parse(init.body as string);
      expect(body.query.toCommune).toBe("Oran");
    });

    it("retombe sur fee 0 / estimatedDays 2 si dzship ne renvoie pas ces champs", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(
          makeDzshipResponse({ deliveryFee: undefined, estimatedDays: undefined })
        );
      vi.stubGlobal("fetch", fetchMock);

      const res = await POST(makeRequest({ wilayaCode: "31", deliveryMode: "HOME" }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ fee: 0, estimatedDays: 2 });
    });
  });

  describe("échec dzship → repli matrice", () => {
    it("repli matrice quand dzship répond HTTP non-ok", async () => {
      mockedFindUnique.mockResolvedValue(makeMatrix());
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: "x" } }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const res = await POST(makeRequest({ wilayaCode: "31", deliveryMode: "HOME" }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ fee: 800, estimatedDays: 3 });
    });

    it("repli matrice quand fetch rejette (réseau down)", async () => {
      mockedFindUnique.mockResolvedValue(makeMatrix());
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

      const res = await POST(makeRequest({ wilayaCode: "31", deliveryMode: "HOME" }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ fee: 800, estimatedDays: 3 });
    });

    it("repli matrice quand la réponse JSON est invalide", async () => {
      mockedFindUnique.mockResolvedValue(makeMatrix());
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => {
            throw new SyntaxError("Unexpected token");
          },
        })
      );

      const res = await POST(makeRequest({ wilayaCode: "31", deliveryMode: "HOME" }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ fee: 800, estimatedDays: 3 });
    });
  });

  describe("cache", () => {
    it("ne rappelle pas dzship pour une requête identique (cache 5 min)", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeDzshipResponse());
      vi.stubGlobal("fetch", fetchMock);

      const first = await POST(makeRequest({ wilayaCode: "31", deliveryMode: "HOME" }));
      const second = await POST(makeRequest({ wilayaCode: "31", deliveryMode: "HOME" }));

      expect(await first.json()).toEqual({ fee: 700, estimatedDays: 3 });
      expect(await second.json()).toEqual({ fee: 700, estimatedDays: 3 });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("rappelle dzship quand la clé de cache change (deliveryType différent)", async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeDzshipResponse());
      vi.stubGlobal("fetch", fetchMock);

      await POST(makeRequest({ wilayaCode: "31", deliveryMode: "HOME" }));
      await POST(makeRequest({ wilayaCode: "31", deliveryMode: "STOP_DESK" }));

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("erreur globale", () => {
    it("retourne { fee: 0, estimatedDays: 2 } si le body JSON est invalide", async () => {
      const res = await POST(
        new NextRequest("http://localhost/api/delivery/calculate", {
          method: "POST",
          body: "not-json",
        })
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ fee: 0, estimatedDays: 2 });
    });
  });
});
