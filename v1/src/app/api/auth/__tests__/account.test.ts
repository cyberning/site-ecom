import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { Prisma } from "@prisma/client";

// Mocks des dépendances externes
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PATCH } from "../account/route";

// `auth` est surchargé (utilisable comme middleware Next.js) : on caste vers
// la signature utilisée par les routes API : () => Promise<Session | null>
const mockedAuth = vi.mocked(auth) as unknown as Mock<() => Promise<Session | null>>;
const mockedFindUnique = vi.mocked(prisma.user.findUnique);
const mockedUpdate = vi.mocked(prisma.user.update);

// Silence console.error pendant les tests (cas 500)
vi.spyOn(console, "error").mockImplementation(() => {});

const session: Session = {
  user: { id: "user-1", email: "admin@test.com", role: "ADMIN" },
  expires: "2026-01-01T00:00:00.000Z",
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/auth/account", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue(session);
});

describe("PATCH /api/auth/account", () => {
  it("retourne 401 si l'utilisateur n'est pas connecté", async () => {
    mockedAuth.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ email: "new@test.com" }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Non autorisé" });
  });

  it("retourne 400 si l'email est invalide", async () => {
    const res = await PATCH(makeRequest({ email: "not-an-email" }));

    expect(res.status).toBe(400);
    expect(mockedFindUnique).not.toHaveBeenCalled();
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("retourne 400 si le corps de requête est un JSON invalide", async () => {
    const req = new NextRequest("http://localhost/api/auth/account", {
      method: "PATCH",
      body: "{invalid json",
    });

    const res = await PATCH(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Corps de requête invalide" });
  });

  it("retourne 409 si l'email est déjà pris par un autre utilisateur", async () => {
    mockedFindUnique.mockResolvedValue({
      id: "other-user",
      email: "taken@test.com",
    } as never);

    const res = await PATCH(makeRequest({ email: "taken@test.com" }));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Cet email est déjà utilisé" });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("retourne 200 et l'utilisateur mis à jour en cas de succès", async () => {
    mockedFindUnique.mockResolvedValue(null);
    const updatedUser = {
      id: "user-1",
      email: "new@test.com",
      name: "Admin",
      role: "ADMIN",
      isActive: true,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-02T00:00:00Z"),
    };
    mockedUpdate.mockResolvedValue(updatedUser as never);

    const res = await PATCH(makeRequest({ email: "new@test.com" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe("new@test.com");
    expect(body).not.toHaveProperty("passwordHash");
    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { email: "new@test.com" },
      })
    );
  });

  it("normalise l'email (minuscules) avant la recherche et la mise à jour", async () => {
    mockedFindUnique.mockResolvedValue(null);
    const updatedUser = {
      id: "user-1",
      email: "admin@test.com",
      name: "Admin",
      role: "ADMIN",
      isActive: true,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-02T00:00:00Z"),
    };
    mockedUpdate.mockResolvedValue(updatedUser as never);

    const res = await PATCH(makeRequest({ email: "Admin@Test.com" }));

    expect(res.status).toBe(200);
    expect(mockedFindUnique).toHaveBeenCalledWith({
      where: { email: "admin@test.com" },
    });
    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { email: "admin@test.com" },
      })
    );
  });

  it("retourne 409 si la contrainte d'unicité est violée (course condition)", async () => {
    mockedFindUnique.mockResolvedValue(null);
    mockedUpdate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      })
    );

    const res = await PATCH(makeRequest({ email: "new@test.com" }));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Cet email est déjà utilisé" });
  });

  it("retourne 500 en cas d'erreur serveur", async () => {
    mockedFindUnique.mockResolvedValue(null);
    mockedUpdate.mockRejectedValue(new Error("DB down"));

    const res = await PATCH(makeRequest({ email: "new@test.com" }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Erreur serveur" });
  });
});
