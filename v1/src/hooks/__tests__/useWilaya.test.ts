import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useWilaya } from "../useWilaya";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useWilaya", () => {
  it("charge les wilayas au montage", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { code: "16", name: "Alger", nameAr: "الجزائر" },
        { code: "31", name: "Oran", nameAr: "وهران" },
      ],
    });

    const { result } = renderHook(() => useWilaya());

    // Initially loading
    expect(result.current.loadingWilayas).toBe(true);

    await waitFor(() => {
      expect(result.current.loadingWilayas).toBe(false);
    });

    expect(result.current.wilayas).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledWith("/api/wilayas");
  });

  it("gère l'erreur de fetch des wilayas", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useWilaya());

    await waitFor(() => {
      expect(result.current.loadingWilayas).toBe(false);
    });

    expect(result.current.wilayas).toHaveLength(0);
  });

  it("charge les communes quand une wilaya est sélectionnée", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ code: "16", name: "Alger", nameAr: "الجزائر" }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { code: "16001", name: "Bab El Oued", nameAr: "باب الوادي", wilayaCode: "16" },
          { code: "16002", name: "Sidi M'Hamed", nameAr: "سيدي امحمد", wilayaCode: "16" },
        ],
      });

    const { result } = renderHook(() => useWilaya());

    await waitFor(() => {
      expect(result.current.loadingWilayas).toBe(false);
    });

    // Sélectionner une wilaya via setSelectedWilaya
    act(() => {
      result.current.setSelectedWilaya("16");
    });

    await waitFor(() => {
      expect(result.current.loadingCommunes).toBe(false);
    });

    expect(result.current.communes).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledWith("/api/communes?wilayaCode=16");
  });

  it("vide les communes quand la wilaya est réinitialisée", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ code: "16", name: "Alger", nameAr: "الجزائر" }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { code: "16001", name: "Bab El Oued", nameAr: "باب الوادي", wilayaCode: "16" },
        ],
      });

    const { result } = renderHook(() => useWilaya());

    await waitFor(() => {
      expect(result.current.loadingWilayas).toBe(false);
    });

    // Sélectionner une wilaya
    act(() => {
      result.current.setSelectedWilaya("16");
    });

    await waitFor(() => {
      expect(result.current.communes).toHaveLength(1);
    });

    // Réinitialiser la wilaya
    act(() => {
      result.current.setSelectedWilaya("");
    });

    expect(result.current.communes).toHaveLength(0);
  });

  it("retourne selectedWilaya et loadingCommunes initiaux", () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() => useWilaya());

    expect(result.current.selectedWilaya).toBe("");
    expect(result.current.loadingCommunes).toBe(false);
  });
});
