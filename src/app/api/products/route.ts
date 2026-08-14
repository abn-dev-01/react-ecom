import { NextRequest, NextResponse } from "next/server";
import { mockProducts } from "@/lib/mock-products";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  // Simulated network latency so the loading state in the UI is actually
  // observable in dev, instead of resolving instantly on localhost.
  await delay(500);

  // A magic value so the error UI can be exercised on demand, without
  // needing a real network failure: type "error" into the search box.
  if (query.toLowerCase() === "error") {
    return NextResponse.json(
      { error: "Simulated server error for testing." },
      { status: 500 }
    );
  }

  const lowerQuery = query.toLowerCase();
  const filtered = query
    ? mockProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerQuery) ||
          product.description.toLowerCase().includes(lowerQuery)
      )
    : mockProducts;

  return NextResponse.json({ products: filtered });
}
