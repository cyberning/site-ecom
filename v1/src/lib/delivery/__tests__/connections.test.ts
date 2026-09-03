import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks des dépendances externes
vi.mock("@/lib/prisma", () => ({
  prisma: {
    setting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/getStoreSettings", () => ({
  invalidateStoreSettingsCache: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { invalidateStoreSettingsCache } from "@/lib/getStoreSettings";
import {
  getConnections,
  saveConnection,
  removeConnection,
  maskCredentials,
  type DeliveryConnection,
} from "../connections";

const mockedFindUnique = vi.mocked(prisma.setting.findUnique);
const mockedUpsert = vi.mocked(prisma.setting.upsert);
const mockedInvalidate = vi.mocked(invalidateStoreSettingsCache);

const baseConn: DeliveryConnection = {
  code: "YALIDINE",
  name: "Yalidine",
  platform: "dzship",
  credentials: { apiKey: "secret-key" },
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("maskCredentials", () => {
  it("masque les valeurs des credentials en conservant les clés", () => {
    const conn: DeliveryConnection = {
      ...baseConn,
      credentials: { apiKey: "secret-key", token: "abc123" },
    };

    const masked = maskCredentials(conn);

    expect(masked.credentials).toEqual({ apiKey: "••••••••", token: "••••••••" });
    expect(masked.code).toBe("YALIDINE");
    expect(masked.name).toBe("Yalidine");
    expect(masked.isActive).toBe(true);
  });

  it("ne mute pas l'objet original", () => {
    const conn: DeliveryConnection = {
      ...baseConn,
      credentials: { apiKey: "secret-key" },
    };

    const masked = maskCredentials(conn);

    expect(conn.credentials.apiKey).toBe("secret-key");
    expect(masked).not.toBe(conn);
    expect(masked.credentials).not.toBe(conn.credentials);
  });
});

describe("getConnections", () => {
  it("retourne [] quand la setting est absente", async () => {
    mockedFindUnique.mockResolvedValue(null);

    const result = await getConnections();

    expect(result).toEqual([]);
    expect(mockedFindUnique).toHaveBeenCalledWith({ where: { key: "delivery_providers" } });
  });

  it("retourne [] quand la valeur n'est pas un tableau", async () => {
    mockedFindUnique.mockResolvedValue({ value: { not: "an array" } } as never);

    const result = await getConnections();

    expect(result).toEqual([]);
  });

  it("retourne les connexions stockées", async () => {
    mockedFindUnique.mockResolvedValue({ value: [baseConn] } as never);

    const result = await getConnections();

    expect(result).toEqual([baseConn]);
  });
});

describe("saveConnection", () => {
  it("ajoute une nouvelle connexion", async () => {
    mockedFindUnique.mockResolvedValue(null);

    await saveConnection(baseConn);

    expect(mockedUpsert).toHaveBeenCalledWith({
      where: { key: "delivery_providers" },
      update: { value: [baseConn] },
      create: { key: "delivery_providers", value: [baseConn] },
    });
    expect(mockedInvalidate).toHaveBeenCalled();
  });

  it("met à jour par code sans créer de doublon", async () => {
    mockedFindUnique.mockResolvedValue({ value: [baseConn] } as never);
    const updated = { ...baseConn, name: "Yalidine Express" };

    await saveConnection(updated);

    expect(mockedUpsert).toHaveBeenCalledWith({
      where: { key: "delivery_providers" },
      update: { value: [updated] },
      create: { key: "delivery_providers", value: [updated] },
    });
    expect(mockedUpsert).toHaveBeenCalledTimes(1);
  });
});

describe("removeConnection", () => {
  it("retire la connexion par code", async () => {
    const other: DeliveryConnection = {
      ...baseConn,
      code: "ZR_EXPRESS",
      name: "ZR Express",
    };
    mockedFindUnique.mockResolvedValue({ value: [baseConn, other] } as never);

    await removeConnection("YALIDINE");

    expect(mockedUpsert).toHaveBeenCalledWith({
      where: { key: "delivery_providers" },
      update: { value: [other] },
      create: { key: "delivery_providers", value: [other] },
    });
    expect(mockedInvalidate).toHaveBeenCalled();
  });
});
