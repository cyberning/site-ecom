import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDelivery } from "../useDelivery";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useDelivery", () => {
  it("retourne fee=0 quand aucun wilayaCode", () => {
    const { result } = renderHook(() => useDelivery("", "HOME"));

    expect(result.current.fee).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calcule les frais de livraison HOME", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ fee: 600, estimatedDays: 2 }),
    });

    const { result } = renderHook(() => useDelivery("16", "HOME"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.fee).toBe(600);
    expect(result.current.estimatedDays).toBe(2);
    expect(mockFetch).toHaveBeenCalledWith("/api/delivery/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wilayaCode: "16", deliveryMode: "HOME" }),
    });
  });

  it("calcule les frais de livraison STOP_DESK", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ fee: 400, estimatedDays: 3 }),
    });

    const { result } = renderHook(() => useDelivery("31", "STOP_DESK"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.fee).toBe(400);
    expect(result.current.estimatedDays).toBe(3);
    expect(mockFetch).toHaveBeenCalledWith("/api/delivery/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wilayaCode: "31", deliveryMode: "STOP_DESK" }),
    });
  });

  it("gère l'erreur de fetch", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useDelivery("16", "HOME"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.fee).toBe(0);
  });

  it("utilise les valeurs par défaut si data incomplète", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useDelivery("16", "HOME"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.fee).toBe(0);
    expect(result.current.estimatedDays).toBe(2);
  });
});
