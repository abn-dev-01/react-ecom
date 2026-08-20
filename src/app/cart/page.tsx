import { Container } from "@/components/layout/Container";
import { ShippingAddressForm } from "@/components/cart/ShippingAddressForm";

// Cart contents/state arrive in Module 5 (Async) + Module 9 (architecture).
// For now this page hosts the shipping form built in Module 4.
export default function CartPage() {
  return (
    <main>
      <Container className="py-12">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Shipping details
        </h1>
        <p className="mt-2 text-zinc-600">
          Cart contents arrive in a later module — this form validates
          end-to-end on its own for now.
        </p>

        <div className="mt-8">
          <ShippingAddressForm />
        </div>
      </Container>
    </main>
  );
}
