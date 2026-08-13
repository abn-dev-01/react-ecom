import { Product } from "@/types/product";
import { ProductCard } from "@/components/product/ProductCard";

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  if (products.length === 0) {
    return <p className="text-zinc-600">No products found.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        // key must be stable and unique per item so React can match
        // list items across re-renders instead of re-mounting everything.
        // Never use the array index here once the list can reorder/filter.
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
