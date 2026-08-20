import { NextRequest, NextResponse } from "next/server";
import { mockProducts } from "@/lib/mock-products";
import { createAddToCartSchema } from "@/lib/validation/add-to-cart";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    productId?: unknown;
    variant?: unknown;
    quantity?: unknown;
  } | null;

  if (!body || typeof body.productId !== "string") {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const product = mockProducts.find((p) => p.id === body.productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  // Re-validate with the exact same schema the client used. The client's
  // check is for instant UX feedback; this is the real boundary of trust —
  // a request can reach this endpoint from anywhere (curl, another app),
  // not only from AddToCartForm.tsx.
  const schema = createAddToCartSchema(product.variants);
  const result = schema.safeParse({
    variant: body.variant,
    quantity: body.quantity,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid variant or quantity.", issues: result.error.issues },
      { status: 400 }
    );
  }

  await delay(600);

  // A rule the client has no way to know statically: current stock. This
  // is exactly the kind of check that belongs on the server only — the
  // client's Zod schema caps quantity at 10 for sanity, but "how many are
  // actually in the warehouse" can only be answered here.
  if (result.data.quantity > product.stock) {
    return NextResponse.json(
      { error: `Only ${product.stock} left in stock.` },
      { status: 409 }
    );
  }

  return NextResponse.json({
    success: true,
    cartItem: {
      productId: product.id,
      productName: product.name,
      variant: result.data.variant,
      quantity: result.data.quantity,
    },
  });
}
