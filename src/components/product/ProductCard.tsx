"use client"; // needed because this component uses useState (interactivity)

import { useState } from "react";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AddToCartForm } from "@/components/product/AddToCartForm";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <Card>
      <Card.Media>
        {/* eslint-disable-next-line @next/next/no-img-element -- plain <img> for now; next/image needs remote-domain config, covered later */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-48 w-full object-cover"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsFavorited((prev) => !prev)}
          aria-pressed={isFavorited}
          aria-label={
            isFavorited ? "Remove from favorites" : "Add to favorites"
          }
          className="absolute right-2 top-2 h-8 w-8 rounded-full p-0 text-lg leading-none shadow"
        >
          {isFavorited ? "♥" : "♡"}
        </Button>
      </Card.Media>

      <Card.Body>
        <h3 className="font-semibold text-zinc-900">{product.name}</h3>
        <p className="text-sm text-zinc-600">{product.description}</p>
        <p className="mt-2 font-medium text-zinc-900">
          {formatPrice(product.priceInCents)}
        </p>

        <div className="mt-3 border-t border-zinc-100 pt-3">
          <AddToCartForm product={product} />
        </div>
      </Card.Body>
    </Card>
  );
}
