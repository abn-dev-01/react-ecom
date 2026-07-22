// A Product is the core domain object of the storefront.
// Keeping it in its own file means every module (cart, checkout, search...)
// imports the same shape instead of redefining it — one source of truth.
export interface Product {
  id: string;
  name: string;
  description: string;
  /** Price in cents (integer) — avoids floating-point rounding bugs with money. */
  priceInCents: number;
  imageUrl: string;
}
