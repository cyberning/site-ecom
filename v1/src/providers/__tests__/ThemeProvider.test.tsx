import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import ThemeProvider, { useTheme } from "../ThemeProvider";
import { getThemeDefaults, BRAND_DEFAULTS } from "@/lib/themeDefaults";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Flag mutable pour piloter l'authentification (vi.mock est hoisté en haut du fichier).
const authMock = vi.hoisted(() => ({ isAuthenticated: false }));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: authMock.isAuthenticated ? { user: { id: "1" } } : null,
    status: authMock.isAuthenticated ? "authenticated" : "unauthenticated",
    update: vi.fn(),
  }),
}));

const mockFetch = vi.fn();

// Simule la base de données : les valeurs envoyées en PUT /api/admin/customize
// sont renvoyées par le GET suivant (comportement réel de l'API).
const dbStore: Record<string, string | number> = {};

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
  mockFetch.mockImplementation(async (url: string, init?: RequestInit) => {
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body));
      if (url === "/api/admin/customize") {
        for (const { key, value } of body.settings) {
          dbStore[key] = value;
        }
      }
      return { ok: true, json: async () => ({}) };
    }
    // GET /api/admin/customize : renvoie les valeurs DB brutes (sans fusion)
    return {
      ok: true,
      json: async () => Object.entries(dbStore).map(([key, value]) => ({ key, value })),
    };
  });
  authMock.isAuthenticated = false;
  for (const key of Object.keys(dbStore)) delete dbStore[key];
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.cssText = "";
  document.cookie = "theme=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wrapper qui fournit le ThemeProvider (thème initial NEUMORPHISM). */
function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider initialTheme="NEUMORPHISM">{children}</ThemeProvider>;
}

/** Retourne les appels fetch PUT vers une URL donnée. */
function findPutCalls(url: string) {
  return mockFetch.mock.calls.filter(
    ([callUrl, init]) => callUrl === url && (init as RequestInit)?.method === "PUT"
  );
}

/** Attend que le fetch de montage (GET /api/admin/customize) soit terminé. */
async function waitForMountFetch() {
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalled();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ThemeProvider.setTheme", () => {
  it("applique le thème localement : attribut data-theme, cookie et variables CSS", async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitForMountFetch();

    await act(async () => {
      await result.current.setTheme("TECH");
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("TECH");
    expect(document.cookie).toContain("theme=TECH");

    // La couleur de texte secondaire du nouveau thème doit être appliquée
    // (bug corrigé : la couleur ne s'appliquait pas au changement de thème).
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--text-secondary")).toBe("#CBD5E1");
    });
  });

  it("réinitialise les valeurs DB aux défauts du nouveau thème quand l'admin est authentifié", async () => {
    authMock.isAuthenticated = true;
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitForMountFetch();

    await act(async () => {
      await result.current.setTheme("TECH");
    });

    // Sauvegarde du thème actif en DB
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/settings",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "active_theme",
          value: "TECH",
          type: "string",
          category: "theme",
        }),
      })
    );

    // Réinitialisation des personnalisations aux défauts du nouveau thème (LE FIX).
    // Les clés d'identité de marque (BRAND_DEFAULTS) sont exclues : elles sont
    // indépendantes du thème et ne doivent pas être écrasées par le changement.
    const putCustomize = findPutCalls("/api/admin/customize");
    expect(putCustomize).toHaveLength(1);
    const body = JSON.parse(String((putCustomize[0][1] as RequestInit).body));
    const expectedPayload = Object.entries(getThemeDefaults("TECH"))
      .filter(([key]) => !(key in BRAND_DEFAULTS))
      .map(([key, value]) => ({ key, value }));
    expect(body.settings).toEqual(expectedPayload);

    // Aucune clé de marque ne doit être réinitialisée en DB
    for (const brandKey of Object.keys(BRAND_DEFAULTS)) {
      expect(body.settings.some((s: { key: string }) => s.key === brandKey)).toBe(false);
    }

    // Assertion ciblée sur la couleur de texte secondaire (symptôme du bug)
    const textSecondary = body.settings.find(
      (s: { key: string }) => s.key === "custom_text_secondary"
    );
    expect(textSecondary).toEqual({ key: "custom_text_secondary", value: "#CBD5E1" });
  });

  it("ne sauvegarde pas en DB quand l'utilisateur n'est pas authentifié", async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await waitForMountFetch();

    await act(async () => {
      await result.current.setTheme("LUXURY");
    });

    // Application locale quand même
    expect(document.documentElement.getAttribute("data-theme")).toBe("LUXURY");
    expect(document.cookie).toContain("theme=LUXURY");
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--text-secondary")).toBe("#D4D4D4");
    });

    // Aucun appel PUT (ni settings ni customize)
    const putCalls = mockFetch.mock.calls.filter(
      ([, init]) => (init as RequestInit)?.method === "PUT"
    );
    expect(putCalls).toHaveLength(0);
  });
});
