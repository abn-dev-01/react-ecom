"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import { getJson, ApiError } from "@/lib/api-client";

const DEBOUNCE_MS = 300;

interface UseProductSearchResult {
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

// Module-level, not component state: shared by every component instance
// for the life of the page, so navigating away and back (or two search
// boxes, hypothetically) don't re-fetch a query already answered. A real
// app would reach for React Query/SWR, which do this plus request
// deduping, revalidation, etc. — this is the same core idea made visible.
const searchCache = new Map<string, Product[]>();

export function useProductSearch(
  query: string,
  initialProducts: Product[]
): UseProductSearchResult {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    // Empty search box: show the page's initial list, no network involved.
    if (trimmed === "") {
      setProducts(initialProducts);
      setError(null);
      setIsLoading(false);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached) {
      setProducts(cached);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    // Debounce: wait for a pause in typing before firing a request, so
    // "shirt" doesn't cause 5 requests (s, sh, shi, shir, shirt). Only
    // start showing "Searching…" once the debounced fetch actually
    // begins — not while just waiting out the timer — so fast typing
    // doesn't flicker a loading state on every keystroke.
    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      setError(null);

      getJson<{ products: Product[] }>(
        `/api/products?q=${encodeURIComponent(trimmed)}`,
        controller.signal
      )
        .then((data) => {
          searchCache.set(cacheKey, data.products);
          setProducts(data.products);
          setIsLoading(false);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) {
            // A newer keystroke superseded this request. That newer
            // effect run owns isLoading/error now — don't touch them.
            return;
          }
          setError(
            err instanceof ApiError ? err.message : "Search failed. Try again."
          );
          setIsLoading(false);
        });
    }, DEBOUNCE_MS);

    // Cleanup runs before the *next* effect and on unmount: cancels a
    // still-waiting debounce timer, and aborts an in-flight request so
    // its eventual response can't overwrite a newer one (a classic React
    // data-fetching race condition — see doc/05 for the full story).
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, initialProducts]);

  return { products, isLoading, error };
}
