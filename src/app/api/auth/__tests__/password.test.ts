import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { NextRequest } from "next/server";
import type { Session } from "next-auth";

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

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
  compare: vi.fn(),
  hash: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { PATCH } from "../password/route";

// `auth` est surchargé (utilisable comme middleware Next.js) : on caste vers
// la signature utilisée par les routes API : () => Promise<Session | null>
const mockedAuth = vi.mocked(auth) as unknown as Mock<() => Promise<Session | null>>;
const mockedFindUnique = vi.mocked(prisma.user.findUnique);
const mockedUpdate = vi.mocked(prisma.user.update);
// `bcrypt.compare`/`bcrypt.hash` sont surchargés (variante callback → void) :
// on caste vers la variante Promise utilisée par les routes API
const mockedCompare = vi.mocked(bcrypt.compare) as unknown as Mock<
  (s: string, hash: string) => Promise<boolean>
>;
const mockedHash = vi.mocked(bcrypt.hash) as unknown as Mock<
  (s: string, salt: number | string) => Promise<string>
>;

// Silence console.error pendant les tests (cas 500)
vi.spyOn(console, "error").mockImplementation(() => {});

const session: Session = {
  user: { id: "user-1", email: "admin@test.com", role: "ADMIN" },
  expires: "2026-01-01T00:00:00.000Z",
};

const user = {
  id: "user-1",
  email: "admin@test.com",
  name: "Admin",
  passwordHash: "$2a$10$hashed",
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/auth/password", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue(session);
});

describe("PATCH /api/auth/password", () => {
  it("retourne 401 si l'utilisateur n'est pas connecté", async () => {
    mockedAuth.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ currentPassword: "oldpass", newPassword: "newpass" }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Non autorisé" });
  });

  it("retourne 400 si la validation échoue (newPassword trop court)", async () => {
    const res = await PATCH(makeRequest({ currentPassword: "oldpass", newPassword: "12345" }));

    expect(res.status).toBe(400);
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });

  it("retourne 400 si le mot de passe actuel est incorrect", async () => {
    mockedFindUnique.mockResolvedValue(user as never);
    mockedCompare.mockResolvedValue(false);

    const res = await PATCH(makeRequest({ currentPassword: "wrongpass", newPassword: "newpass" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Mot de passe actuel incorrect" });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("retourne 404 si l'utilisateur est introuvable", async () => {
    mockedFindUnique.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ currentPassword: "oldpass", newPassword: "newpass" }));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Utilisateur introuvable" });
  });

  it("retourne 200 et met à jour le mot de passe en cas de succès", async () => {
    mockedFindUnique.mockResolvedValue(user as never);
    mockedCompare.mockResolvedValue(true);
    mockedHash.mockResolvedValue("$2a$10$newhash");

    const res = await PATCH(makeRequest({ currentPassword: "oldpass", newPassword: "newpass" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mockedHash).toHaveBeenCalledWith("newpass", 10);
    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { passwordHash: "$2a$10$newhash" },
    });
  });

  it("retourne 500 en cas d'erreur serveur", async () => {
    mockedFindUnique.mockResolvedValue(user as never);
    mockedCompare.mockResolvedValue(true);
    mockedHash.mockResolvedValue("$2a$10$newhash");
    mockedUpdate.mockRejectedValue(new Error("DB down"));

    const res = await PATCH(makeRequest({ currentPassword: "oldpass", newPassword: "newpass" }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Erreur serveur" });
  });
});
