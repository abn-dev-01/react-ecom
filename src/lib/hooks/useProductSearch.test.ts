import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useProductSearch } from "@/lib/hooks/useProductSearch";
import { Product } from "@/types/product";

const initialProduct: Product = {
  id: "p1",
  name: "Everyday Canvas Tote",
  description: "A durable, minimal tote for daily use.",
  priceInCents: 3200,
  imageUrl: "https://example.com/tote.jpg",
  variants: ["Small", "Large"],
  stock: 8,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// Note: these tests use real timers and really wait out the ~300ms
// debounce rather than mocking it away with vi.useFakeTimers(). That
// makes this the slowest file in the suite, but sidesteps the fiddly
// interaction between fake timers and pending Promises from a mocked
// fetch — worth knowing as a deliberate trade-off, not an oversight.

describe("useProductSearch", () => {
  it("shows the initial products immediately for an empty query, without calling the API", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useProductSearch("", [initialProduct]));

    expect(result.current.products).toEqual([initialProduct]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a loading state only once the debounced fetch actually starts", async () => {
    let resolveFetch!: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(pending);
    vi.stubGlobal("fetch", fetchMock);

    const { result, rerender } = renderHook(
      ({ query }) => useProductSearch(query, [initialProduct]),
      { initialProps: { query: "" } }
    );

    rerender({ query: "loadingtest" });

    // Still inside the debounce window: no request yet, and critically,
    // no loading flicker while just waiting out the timer.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(result.current.isLoading).toBe(true);

    resolveFetch({
      ok: true,
      json: async () => ({
        products: [{ ...initialProduct, name: "Loading Result" }],
      }),
    });

    await waitFor(() => {
      expect(result.current.products[0].name).toBe("Loading Result");
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("shows an error message when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Simulated server error for testing." }),
      } as Response)
    );

    const { result, rerender } = renderHook(
      ({ query }) => useProductSearch(query, [initialProduct]),
      { initialProps: { query: "" } }
    );

    // "error" is the same magic query the real /api/products route
    // treats as a forced 500 — mocked here rather than hitting the real
    // route, but exercising the same documented behavior.
    rerender({ query: "error" });

    await waitFor(() => {
      expect(result.current.error).toBe("Simulated server error for testing.");
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("caches results so repeating an exact search doesn't refetch", async () => {
    const cachedProducts = [{ ...initialProduct, name: "Cached Tote" }];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ products: cachedProducts }),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const { result, rerender } = renderHook(
      ({ query }) => useProductSearch(query, [initialProduct]),
      { initialProps: { query: "" } }
    );

    rerender({ query: "uniquecachekey" });
    await waitFor(() => {
      expect(result.current.products).toEqual(cachedProducts);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Clear the search box, then search the exact same term again.
    rerender({ query: "" });
    rerender({ query: "uniquecachekey" });

    await waitFor(() => {
      expect(result.current.products).toEqual(cachedProducts);
    });
    // Still one network call total — the second search was served from
    // the in-memory cache, not a new request.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
