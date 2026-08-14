import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { AddToCartForm } from "@/components/product/AddToCartForm";
import { Product } from "@/types/product";

// A fixed product fixture, independent of mock-products.ts, so this test
// doesn't break if the catalog's sample data ever changes.
const product: Product = {
  id: "p1",
  name: "Everyday Canvas Tote",
  description: "A durable, minimal tote for daily use.",
  priceInCents: 3200,
  imageUrl: "https://example.com/tote.jpg",
  variants: ["Small", "Large"],
  stock: 8,
};

// Behavior-driven tests stub the network boundary (fetch), not internal
// implementation details — every assertion below is something a user
// could actually observe on screen.
function stubFetchOnce(response: { ok: boolean; status?: number; body: unknown }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 400),
    json: async () => response.body,
  } as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AddToCartForm", () => {
  it("blocks submission and shows a field error for an invalid quantity, without calling the API", async () => {
    const fetchMock = stubFetchOnce({ ok: true, body: { success: true } });
    const user = userEvent.setup();
    render(<AddToCartForm product={product} />);

    const quantityInput = screen.getByLabelText("Quantity");
    await user.clear(quantityInput);
    await user.type(quantityInput, "0");
    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(await screen.findByText("Quantity must be at least 1")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits the selected variant and quantity, and shows a confirmation on success", async () => {
    const fetchMock = stubFetchOnce({
      ok: true,
      body: {
        success: true,
        cartItem: {
          productId: "p1",
          productName: product.name,
          variant: "Large",
          quantity: 2,
        },
      },
    });
    const user = userEvent.setup();
    render(<AddToCartForm product={product} />);

    await user.selectOptions(screen.getByLabelText("Option"), "Large");
    const quantityInput = screen.getByLabelText("Quantity");
    await user.clear(quantityInput);
    await user.type(quantityInput, "2");
    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(
      await screen.findByText(`Added 2 × ${product.name} (Large).`)
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/cart",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ productId: "p1", variant: "Large", quantity: 2 }),
      })
    );
  });

  it("shows a root-level error when the server rejects the request (e.g. out of stock)", async () => {
    stubFetchOnce({ ok: false, status: 409, body: { error: "Only 3 left in stock." } });
    const user = userEvent.setup();
    render(<AddToCartForm product={product} />);

    // Defaults (Small, qty 1) are valid client-side — this exercises the
    // server-only stock rule, not a validation error.
    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(await screen.findByText("Only 3 left in stock.")).toBeInTheDocument();
  });

  it("disables the submit button and shows pending text while the request is in flight", async () => {
    let resolveFetch!: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(pending)
    );

    const user = userEvent.setup();
    render(<AddToCartForm product={product} />);

    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(await screen.findByRole("button", { name: "Adding…" })).toBeDisabled();

    resolveFetch({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        cartItem: {
          productId: "p1",
          productName: product.name,
          variant: "Small",
          quantity: 1,
        },
      }),
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add to Cart" })).toBeInTheDocument();
    });
  });
});
