import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { NextRequest } from "next/server";
import type { Session } from "next-auth";
import type { DeliveryConnection } from "@/lib/delivery/connections";

// Mocks des dépendances externes (hoisted par Vitest)
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/delivery/connections", () => ({
  getConnections: vi.fn(),
  saveConnection: vi.fn(),
  removeConnection: vi.fn(),
  maskCredentials: vi.fn((conn: DeliveryConnection) => ({
    ...conn,
    credentials: Object.fromEntries(Object.keys(conn.credentials).map((k) => [k, "••••••••"])),
  })),
}));

vi.mock("@/lib/logistics/providers/dzship", () => ({
  testDzshipConnection: vi.fn(),
}));

// Silence console.error pendant les tests (cas 500 / dzship down)
vi.spyOn(console, "error").mockImplementation(() => {});

const session: Session = {
  user: { id: "user-1", email: "admin@test.com", role: "ADMIN" },
  expires: "2026-01-01T00:00:00.000Z",
};

const nonAdminSession: Session = {
  user: { id: "user-2", email: "agent@test.com", role: "CALL_AGENT" },
  expires: "2026-01-01T00:00:00.000Z",
};

const baseConn: DeliveryConnection = {
  code: "YALIDINE",
  name: "Yalidine",
  platform: "dzship",
  credentials: { apiKey: "secret-key" },
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

function makeRequest(body: unknown, url = "http://localhost/api/delivery/providers"): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Références re-importées à chaque beforeEach (vi.resetModules() vide le cache
// module de la route, notamment `couriersCache`).
let mockedAuth: Mock<() => Promise<Session | null>>;
let mockedGetConnections: Mock;
let mockedSaveConnection: Mock;
let mockedRemoveConnection: Mock;
let mockedMaskCredentials: Mock;
let mockedTestDzshipConnection: Mock;
let GET: typeof import("../route").GET;
let POST: typeof import("../route").POST;
let POST_TEST: typeof import("../test/route").POST;
let DELETE: typeof import("../[code]/route").DELETE;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();

  const authModule = await import("@/lib/auth");
  const connectionsModule = await import("@/lib/delivery/connections");
  const dzshipModule = await import("@/lib/logistics/providers/dzship");
  const routeModule = await import("../route");
  const testRouteModule = await import("../test/route");
  const codeRouteModule = await import("../[code]/route");

  mockedAuth = vi.mocked(authModule.auth) as unknown as Mock<() => Promise<Session | null>>;
  mockedGetConnections = vi.mocked(connectionsModule.getConnections);
  mockedSaveConnection = vi.mocked(connectionsModule.saveConnection);
  mockedRemoveConnection = vi.mocked(connectionsModule.removeConnection);
  mockedMaskCredentials = vi.mocked(connectionsModule.maskCredentials);
  mockedTestDzshipConnection = vi.mocked(dzshipModule.testDzshipConnection);

  GET = routeModule.GET;
  POST = routeModule.POST;
  POST_TEST = testRouteModule.POST;
  DELETE = codeRouteModule.DELETE;

  // Valeurs par défaut des mocks
  mockedAuth.mockResolvedValue(session);
  mockedGetConnections.mockResolvedValue([baseConn]);
  mockedSaveConnection.mockResolvedValue(undefined);
  mockedRemoveConnection.mockResolvedValue(undefined);
  mockedTestDzshipConnection.mockResolvedValue({ success: true });
});

describe("GET /api/delivery/providers", () => {
  it("retourne 401 si l'utilisateur n'est pas connecté", async () => {
    mockedAuth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Non autorisé" });
    expect(mockedGetConnections).not.toHaveBeenCalled();
  });

  it("retourne 401 si le rôle n'est pas ADMIN", async () => {
    mockedAuth.mockResolvedValue(nonAdminSession);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Non autorisé" });
  });

  it("retourne 200 avec { couriers, connections } quand dzship répond", async () => {
    const couriers = [{ code: "YALIDINE", name: "Yalidine" }];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => couriers,
      })
    );

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.couriers).toEqual(couriers);
    // Les connexions sont masquées dans la réponse
    expect(body.connections).toEqual([{ ...baseConn, credentials: { apiKey: "••••••••" } }]);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/couriers"),
      expect.objectContaining({ headers: { Accept: "application/json" } })
    );
    vi.unstubAllGlobals();
  });

  it("retourne les connexions MASQUÉES (credentials = ••••••••)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      })
    );

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    // maskCredentials est appelé via .map() → (element, index, array)
    expect(mockedMaskCredentials).toHaveBeenCalledWith(baseConn, 0, [baseConn]);
    expect(body.connections[0].credentials).toEqual({ apiKey: "••••••••" });
    expect(body.connections[0].credentials.apiKey).not.toBe("secret-key");
    vi.unstubAllGlobals();
  });

  it("retourne 200 avec couriers: [] et couriersError quand dzship est down", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.couriers).toEqual([]);
    expect(body.couriersError).toBeDefined();
    // Les connexions locales restent présentes (masquées)
    expect(body.connections).toEqual([{ ...baseConn, credentials: { apiKey: "••••••••" } }]);
    vi.unstubAllGlobals();
  });
});

describe("POST /api/delivery/providers", () => {
  it("retourne 401 si l'utilisateur n'est pas connecté", async () => {
    mockedAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ code: "YALIDINE", credentials: { apiKey: "x" } }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Non autorisé" });
    expect(mockedSaveConnection).not.toHaveBeenCalled();
  });

  it("retourne 400 si le champ 'code' est manquant", async () => {
    const res = await POST(makeRequest({ credentials: { apiKey: "x" } }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Le champ 'code' est requis" });
    expect(mockedSaveConnection).not.toHaveBeenCalled();
  });

  it("retourne 400 si 'credentials' est absent", async () => {
    const res = await POST(makeRequest({ code: "YALIDINE" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Le champ 'credentials' est requis (objet)",
    });
    expect(mockedSaveConnection).not.toHaveBeenCalled();
  });

  it("retourne 400 si 'credentials' est un tableau", async () => {
    const res = await POST(makeRequest({ code: "YALIDINE", credentials: [] }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Le champ 'credentials' est requis (objet)",
    });
    expect(mockedSaveConnection).not.toHaveBeenCalled();
  });

  it("retourne 200 avec credentials vide (sandbox dzship)", async () => {
    const res = await POST(makeRequest({ code: "DZSHIP_SANDBOX", credentials: {} }));

    expect(res.status).toBe(200);
    expect(mockedSaveConnection).toHaveBeenCalledTimes(1);
    const saved = mockedSaveConnection.mock.calls[0][0];
    expect(saved.code).toBe("DZSHIP_SANDBOX");
    expect(saved.credentials).toEqual({});
    expect(saved.isActive).toBe(true);
  });

  it("retourne 400 si une valeur de credentials est une chaîne vide", async () => {
    const res = await POST(
      makeRequest({ code: "YALIDINE", credentials: { apiKey: "", token: "abc" } })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Tous les champs credentials doivent être remplis",
    });
    expect(mockedSaveConnection).not.toHaveBeenCalled();
  });

  it("retourne 400 si une valeur de credentials est un espace blanc", async () => {
    const res = await POST(makeRequest({ code: "YALIDINE", credentials: { apiKey: "   " } }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Tous les champs credentials doivent être remplis",
    });
    expect(mockedSaveConnection).not.toHaveBeenCalled();
  });

  it("retourne 400 si 'fromWilaya' est hors bornes 1-69", async () => {
    const res = await POST(
      makeRequest({ code: "YALIDINE", credentials: { apiKey: "x" }, fromWilaya: 70 })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Le champ 'fromWilaya' doit être un entier entre 1 et 69",
    });
    expect(mockedSaveConnection).not.toHaveBeenCalled();
  });

  it("retourne 400 si 'fromWilaya' est inférieur à 1", async () => {
    const res = await POST(
      makeRequest({ code: "YALIDINE", credentials: { apiKey: "x" }, fromWilaya: 0 })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Le champ 'fromWilaya' doit être un entier entre 1 et 69",
    });
    expect(mockedSaveConnection).not.toHaveBeenCalled();
  });

  it("retourne 200 si 'fromWilaya' est une nouvelle wilaya (59-69, Loi 26-06)", async () => {
    const res = await POST(
      makeRequest({ code: "YALIDINE", credentials: { apiKey: "x" }, fromWilaya: 59 })
    );

    expect(res.status).toBe(200);
    const saved = mockedSaveConnection.mock.calls[0][0];
    expect(saved.fromWilaya).toBe(59);
  });

  it("retourne 200 si 'fromWilaya' est la borne supérieure exacte (69)", async () => {
    const res = await POST(
      makeRequest({ code: "YALIDINE", credentials: { apiKey: "x" }, fromWilaya: 69 })
    );

    expect(res.status).toBe(200);
    const saved = mockedSaveConnection.mock.calls[0][0];
    expect(saved.fromWilaya).toBe(69);
  });

  it("retourne 400 si 'baseUrl' n'est pas une URL valide", async () => {
    const res = await POST(
      makeRequest({ code: "YALIDINE", credentials: { apiKey: "x" }, baseUrl: "not-a-url" })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Le champ 'baseUrl' doit être une URL http(s) valide",
    });
    expect(mockedSaveConnection).not.toHaveBeenCalled();
  });

  it("retourne 400 si 'baseUrl' n'est pas http(s)", async () => {
    const res = await POST(
      makeRequest({ code: "YALIDINE", credentials: { apiKey: "x" }, baseUrl: "ftp://example.com" })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Le champ 'baseUrl' doit être une URL http(s) valide",
    });
    expect(mockedSaveConnection).not.toHaveBeenCalled();
  });

  it("retourne 200, appelle saveConnection avec les bons arguments et renvoie une réponse masquée", async () => {
    const res = await POST(
      makeRequest({
        code: "YALIDINE",
        name: "Yalidine",
        platform: "dzship",
        credentials: { apiKey: "secret-key" },
        baseUrl: "https://api.yalidine.com",
        fromWilaya: 16,
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(mockedSaveConnection).toHaveBeenCalledTimes(1);
    const saved = mockedSaveConnection.mock.calls[0][0];
    expect(saved.code).toBe("YALIDINE");
    expect(saved.name).toBe("Yalidine");
    expect(saved.platform).toBe("dzship");
    expect(saved.credentials).toEqual({ apiKey: "secret-key" });
    expect(saved.baseUrl).toBe("https://api.yalidine.com");
    expect(saved.fromWilaya).toBe(16);
    expect(saved.isActive).toBe(true);
    // La réponse est masquée
    expect(body.credentials).toEqual({ apiKey: "••••••••" });
    expect(body.credentials.apiKey).not.toBe("secret-key");
  });

  it("retourne 200 et normalise le code (trim) quand name/platform absents", async () => {
    const res = await POST(makeRequest({ code: "  YALIDINE  ", credentials: { apiKey: "x" } }));

    expect(res.status).toBe(200);
    const saved = mockedSaveConnection.mock.calls[0][0];
    expect(saved.code).toBe("YALIDINE");
    // name et platform retombent sur le code trimé
    expect(saved.name).toBe("YALIDINE");
    expect(saved.platform).toBe("YALIDINE");
  });
});

describe("POST /api/delivery/providers/test", () => {
  it("retourne 401 si l'utilisateur n'est pas connecté", async () => {
    mockedAuth.mockResolvedValue(null);

    const res = await POST_TEST(makeRequest({ code: "YALIDINE", credentials: { apiKey: "x" } }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Non autorisé" });
    expect(mockedTestDzshipConnection).not.toHaveBeenCalled();
  });

  it("retourne 200 { success: true } quand le test réussit", async () => {
    mockedTestDzshipConnection.mockResolvedValue({ success: true });

    const res = await POST_TEST(
      makeRequest({
        code: "YALIDINE",
        credentials: { apiKey: "secret" },
        baseUrl: "https://api.yalidine.com",
      })
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it("retourne 200 { success: false, error } quand le test échoue", async () => {
    mockedTestDzshipConnection.mockResolvedValue({
      success: false,
      error: "Credentials invalides",
    });

    const res = await POST_TEST(
      makeRequest({ code: "YALIDINE", credentials: { apiKey: "wrong" } })
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: false, error: "Credentials invalides" });
  });

  it("appelle testDzshipConnection avec les bons arguments (code trimé, credentials, baseUrl)", async () => {
    await POST_TEST(
      makeRequest({
        code: "  YALIDINE  ",
        credentials: { apiKey: "secret" },
        baseUrl: "https://api.yalidine.com",
      })
    );

    expect(mockedTestDzshipConnection).toHaveBeenCalledWith(
      "YALIDINE",
      { apiKey: "secret" },
      "https://api.yalidine.com"
    );
  });

  it("retourne 400 si le code est manquant", async () => {
    const res = await POST_TEST(makeRequest({ credentials: { apiKey: "x" } }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Le champ 'code' est requis" });
    expect(mockedTestDzshipConnection).not.toHaveBeenCalled();
  });

  it("retourne 400 si credentials est absent", async () => {
    const res = await POST_TEST(makeRequest({ code: "YALIDINE" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Le champ 'credentials' est requis (objet)",
    });
    expect(mockedTestDzshipConnection).not.toHaveBeenCalled();
  });

  it("retourne 400 si credentials est un tableau", async () => {
    const res = await POST_TEST(makeRequest({ code: "YALIDINE", credentials: [] }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Le champ 'credentials' est requis (objet)",
    });
    expect(mockedTestDzshipConnection).not.toHaveBeenCalled();
  });

  it("retourne 200 avec credentials vide (sandbox dzship)", async () => {
    mockedTestDzshipConnection.mockResolvedValue({ success: true });

    const res = await POST_TEST(makeRequest({ code: "DZSHIP_SANDBOX", credentials: {} }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mockedTestDzshipConnection).toHaveBeenCalledWith("DZSHIP_SANDBOX", {}, undefined);
  });

  it("retourne 400 si une valeur de credentials est une chaîne vide", async () => {
    const res = await POST_TEST(
      makeRequest({ code: "YALIDINE", credentials: { apiKey: "", token: "abc" } })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Tous les champs credentials doivent être remplis",
    });
    expect(mockedTestDzshipConnection).not.toHaveBeenCalled();
  });

  it("retourne 400 si une valeur de credentials est un espace blanc", async () => {
    const res = await POST_TEST(makeRequest({ code: "YALIDINE", credentials: { apiKey: "   " } }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Tous les champs credentials doivent être remplis",
    });
    expect(mockedTestDzshipConnection).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/delivery/providers/[code]", () => {
  it("retourne 401 si l'utilisateur n'est pas connecté", async () => {
    mockedAuth.mockResolvedValue(null);

    const res = await DELETE(new NextRequest("http://localhost/api/delivery/providers/YALIDINE"), {
      params: Promise.resolve({ code: "YALIDINE" }),
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Non autorisé" });
    expect(mockedRemoveConnection).not.toHaveBeenCalled();
  });

  it("retourne 200 { success: true } et appelle removeConnection avec le bon code", async () => {
    const res = await DELETE(new NextRequest("http://localhost/api/delivery/providers/YALIDINE"), {
      params: Promise.resolve({ code: "YALIDINE" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mockedRemoveConnection).toHaveBeenCalledWith("YALIDINE");
  });
});
