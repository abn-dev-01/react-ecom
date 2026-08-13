import { Container } from "@/components/layout/Container";

// Placeholder so the Header's "Cart" link resolves instead of 404ing.
// Real cart state and contents arrive in Module 5 (Async & API
// Communication) and Module 9 (state management architecture).
export default function CartPage() {
  return (
    <main>
      <Container className="py-12">
        <h1 className="text-2xl font-semibold text-zinc-900">Cart</h1>
        <p className="mt-4 text-zinc-600">
          Cart functionality arrives in a later module.
        </p>
      </Container>
    </main>
  );
}
