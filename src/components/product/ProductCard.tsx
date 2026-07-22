"use client"; // needed because this component uses useState (interactivity)

import { useState } from "react";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/format";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Local UI state that belongs to this card and nothing else.
  // useState returns a [value, setter] pair; calling the setter
  // triggers React to re-render this component with the new value.
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- plain <img> for now; next/image needs remote-domain config, covered later */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-48 w-full object-cover"
        />
        <button
          type="button"
          onClick={() => setIsFavorited((prev) => !prev)}
          aria-pressed={isFavorited}
          aria-label={
            isFavorited ? "Remove from favorites" : "Add to favorites"
          }
          className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-lg leading-none shadow"
        >
          {isFavorited ? "♥" : "♡"}
        </button>
      </div>

      <div className="flex flex-col gap-1 p-4">
        <h3 className="font-semibold text-zinc-900">{product.name}</h3>
        <p className="text-sm text-zinc-600">{product.description}</p>
        <p className="mt-2 font-medium text-zinc-900">
          {formatPrice(product.priceInCents)}
        </p>
      </div>
    </div>
  );
}
