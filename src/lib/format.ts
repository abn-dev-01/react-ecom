/** Formats integer cents as a localized currency string, e.g. 1999 -> "$19.99". */
export function formatPrice(priceInCents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    priceInCents / 100
  );
}
