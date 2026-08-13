import { ProductList } from "@/components/product/ProductList";
import { mockProducts } from "@/lib/mock-products";
import { Container } from "@/components/layout/Container";

export default function Home() {
  return (
    <main>
      <Container className="py-12">
        <h1 className="mb-8 text-2xl font-semibold text-zinc-900">
          All Products
        </h1>
        <ProductList products={mockProducts} />
      </Container>
    </main>
  );
}
