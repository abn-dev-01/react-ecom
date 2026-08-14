"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { useProductSearch } from "@/lib/hooks/useProductSearch";
import { SearchBar } from "@/components/product/SearchBar";
import { ProductList } from "@/components/product/ProductList";

interface ProductCatalogProps {
  // Rendered by the Server Component (page.tsx) from mock-products.ts —
  // no fetch needed for the very first paint. Every search after that
  // goes through useProductSearch, which talks to /api/products.
  initialProducts: Product[];
}

export function ProductCatalog({ initialProducts }: ProductCatalogProps) {
  const [query, setQuery] = useState("");
  const { products, isLoading, error } = useProductSearch(query, initialProducts);

  return (
    <div>
      <SearchBar value={query} onChange={setQuery} />

      {isLoading && (
        <p role="status" className="mb-4 text-sm text-zinc-500">
          Searching…
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {!isLoading && !error && <ProductList products={products} />}
    </div>
  );
}
