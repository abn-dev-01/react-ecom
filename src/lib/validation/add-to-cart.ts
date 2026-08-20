import { z } from "zod";

// A factory, not a fixed schema, because valid `variant` values are
// different per product (a beanie has "S/M"/"L/XL"; a water bottle has
// "18oz"/"32oz"). The schema is built at the moment we know which product
// we're validating for.
export function createAddToCartSchema(variants: string[]) {
  return z.object({
    // Not z.enum(variants) — z.enum needs a fixed literal tuple known at
    // schema-definition time. variants is a runtime array, so we validate
    // membership with .refine() instead.
    variant: z
      .string()
      .refine((value) => variants.includes(value), {
        error: "Select an option",
      }),
    quantity: z
      .number({ error: "Enter a quantity" })
      .int("Quantity must be a whole number")
      .min(1, "Quantity must be at least 1")
      .max(10, "Quantity can't exceed 10"),
  });
}

export type AddToCartInput = z.infer<ReturnType<typeof createAddToCartSchema>>;
