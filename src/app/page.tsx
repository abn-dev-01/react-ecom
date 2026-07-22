import { ProductList } from "@/components/product/ProductList";
import { mockProducts } from "@/lib/mock-products";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold text-zinc-900">
        All Products
      </h1>
      <ProductList products={mockProducts} />
    </main>
  );
}
