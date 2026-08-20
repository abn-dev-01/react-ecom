import { z } from "zod";

// One tuple of valid codes drives both the Zod schema and the <select>
// options below — the two can never drift out of sync.
const countryCodes = ["US", "CA", "GB", "DE", "FR"] as const;

export const countries: { code: (typeof countryCodes)[number]; label: string }[] = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
];

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.email("Enter a valid email address"),
  addressLine1: z.string().min(5, "Enter your street address"),
  city: z.string().min(2, "Enter your city"),
  postalCode: z
    .string()
    .min(3, "Enter a valid postal code")
    .max(10, "Enter a valid postal code"),
  country: z.enum(countryCodes, { error: "Select a country" }),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
