# Module 4 — Forms & Validation

## New dependencies

Added to `package.json` (run `npm install` to pull them in):

| Package | Version | Role |
|---|---|---|
| `react-hook-form` | `^7.85.0` | Manages form state, registration, and submission without re-rendering on every keystroke. |
| `zod` | `^4.4.3` | Declares validation rules and infers the TypeScript type from them. |
| `@hookform/resolvers` | `^5.4.0` | Bridges the two — lets React Hook Form call a Zod schema to validate on submit. |

Versions confirmed against the npm registry and Zod's official v4 migration guide at the time of writing (see Sources).

## What was built

| File | Role |
|---|---|
| `src/lib/validation/add-to-cart.ts` | Zod schema factory for the variant + quantity form. |
| `src/lib/validation/shipping-address.ts` | Zod schema for the shipping form, plus the country list it's built from. |
| `src/components/product/AddToCartForm.tsx` | Variant selector + quantity + submit, embedded in every product card. |
| `src/components/cart/ShippingAddressForm.tsx` | Full address form on the cart page. |
| `src/components/product/ProductCard.tsx` | **Refactored** — now renders `<AddToCartForm>` in `Card.Body`. |
| `src/app/cart/page.tsx` | **Refactored** — renders `<ShippingAddressForm>` instead of placeholder text. |
| `src/types/product.ts`, `src/lib/mock-products.ts` | Added a `variants: string[]` field, since a variant selector needs something to select from. |

## Why React Hook Form instead of `useState` per field

A naive approach to the shipping form would be six `useState` calls (`fullName`, `email`, `addressLine1`...) plus a `useState` per error message, and manual wiring of `onChange` handlers for each. That works, but every keystroke in `fullName` would re-render the whole form, including unrelated fields, and the error-tracking logic would be duplicated six times.

React Hook Form takes a different approach: fields are **registered** with `register("fieldName")`, which returns `{ name, onChange, onBlur, ref }` spread directly onto the `<input>`. React Hook Form tracks values internally via **uncontrolled inputs** (reading the DOM through the `ref`, not through React state), so typing in one field doesn't trigger a re-render of the component tree at all — only `handleSubmit` and validation trigger updates. This is the "performant" half of "Performant, flexible and extensible forms library," which is React Hook Form's own description of itself.

```tsx
<input id="email" type="email" {...register("email")} />
```

## Why Zod instead of hand-written validation

Hand-written validation (`if (!email.includes("@")) setError(...)`) duplicates knowledge: the shape of valid data lives in the validation `if` statements, and separately in whatever TypeScript type describes the form. Zod collapses these into one definition:

```ts
export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.email("Enter a valid email address"),
  // ...
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
```

`z.infer<typeof shippingAddressSchema>` derives the TypeScript type directly from the runtime schema — there is no second, hand-maintained `interface ShippingAddressInput` that could drift out of sync with the actual validation rules. Change a rule in the schema, and the type (and every place TypeScript checks it) updates automatically.

**`zodResolver`** (`@hookform/resolvers/zod`) is the adapter: it wraps a Zod schema so React Hook Form can call it during `handleSubmit`, and it translates Zod's issues into the `errors` object React Hook Form exposes per field.

```tsx
const { register, handleSubmit, formState: { errors } } = useForm<ShippingAddressInput>({
  resolver: zodResolver(shippingAddressSchema),
  defaultValues: { fullName: "", email: "", /* ... */ },
});
```

## `createAddToCartSchema` — a schema factory, not a schema

`add-to-cart.ts` exports a *function* that returns a schema, not a schema directly:

```ts
export function createAddToCartSchema(variants: string[]) {
  return z.object({
    variant: z.string().refine((value) => variants.includes(value), {
      error: "Select an option",
    }),
    quantity: z.number({ error: "Enter a quantity" })
      .int("Quantity must be a whole number")
      .min(1, "Quantity must be at least 1")
      .max(10, "Quantity can't exceed 10"),
  });
}
```

The reason: valid `variant` values differ per product — a beanie has `"S/M"` / `"L/XL"`, a water bottle has `"18oz"` / `"32oz"`. `z.enum(...)` needs a fixed list of literal values known when the schema is *written*, which doesn't fit data that only exists at runtime (`product.variants`). `.refine()` instead runs an arbitrary function against the value, so `AddToCartForm` calls `createAddToCartSchema(product.variants)` to get a schema scoped to whichever product it's rendering.

## Accessible errors, not just red text

Every field follows the same pattern:

```tsx
<input
  id="email"
  aria-invalid={errors.email ? "true" : "false"}
  aria-describedby={errors.email ? "email-error" : undefined}
  {...register("email")}
/>
{errors.email && (
  <p id="email-error" role="alert" className="...text-red-600">
    {errors.email.message}
  </p>
)}
```

Three things are doing real work here, not just decoration:

- **`aria-invalid`** tells assistive technology the field currently fails validation, independent of the red border a sighted user sees.
- **`aria-describedby` pointing at the error's `id`** links the input to its error message, so a screen reader announces the message when the input receives focus — not just when the error first appears.
- **`role="alert"`** on the error `<p>` makes screen readers announce it immediately when it's added to the DOM (a submit with validation failures), without requiring the user to already be focused on that element.

`noValidate` on both `<form>` elements turns off the browser's built-in HTML5 validation bubbles, so Zod's messages are the only validation UI a user sees — otherwise the two systems can show conflicting messages at once.

## How to verify it

```
cd C:\p\study\react.p\ecom
npm install
npm run dev
```

**Add to Cart (on `/`):** try submitting a product card with quantity `0` or `11` — should show "Quantity must be at least 1" / "Quantity can't exceed 10" without a page reload. Valid submission clears the fields (quantity resets to 1) and shows a green confirmation line.

**Shipping form (on `/cart`):** submit empty — every field should show its own error. Fix one field at a time and re-submit; only unresolved fields keep their error. A fully valid submission replaces the form with a confirmation message and logs the parsed, typed data to the browser console.

## Fix: form field text still unreadable after the Module 3 dark-mode fix

After scoping `color-scheme: light` to `input, select, textarea` (see `doc/03-responsive-ui.md`), the dropdown *popup* rendered correctly, but the field text itself — the visible `<select>` value, the option list rows, the quantity input — was still faint gray-on-white in dark mode.

Cause: `fieldClasses` in both `AddToCartForm.tsx` and `ShippingAddressForm.tsx` set a border but never an explicit text or background color:

```
"w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-brand ..."
```

With no explicit `color`, every field inherited it from `body`, which — in dark mode — is `var(--foreground)`, i.e. `#ededed` (near-white). `color-scheme: light` changes the browser's *default* UA-stylesheet colors for form chrome, but an inherited CSS `color` from an ancestor always wins over that default. So the fields were rendering light gray text on an (also inherited-white-by-default) light background: readable contrast was never actually established, in light or dark mode — it happened to look fine in light mode purely because `#ededed`-ish body text against white already reads as "light gray on white," which is just barely legible, and became actually broken once compounded with the native dropdown panel.

Fix: added explicit `bg-white text-zinc-900` to both components' `fieldClasses`. Form fields no longer inherit page-level theme color at all — they're always white with dark text, regardless of the surrounding page's light/dark state. This is the correct scope for the fix: it touches only the two form components, not `globals.css` or any layout component.

**Lesson worth keeping:** relying on inherited `color` for interactive controls is fragile the moment anything upstream (here, a dark-mode media query) can change that inherited value. Explicit color classes on form fields aren't just a style preference — they're what makes the fields' contrast independent of context.

## What's next — Module 5 preview

Both forms currently fake their submission (a `console.log`, a `setState`). Module 5 (Async & API Communication) replaces those with real `fetch` calls, and introduces loading/error states for when a network request — unlike a local schema check — can actually fail.

## Sources

- [react-hook-form — npm](https://www.npmjs.com/package/react-hook-form) — current version and package description ("Performant, flexible and extensible forms library for React Hooks").
- [Zod — npm](https://www.npmjs.com/package/zod) — current version.
- [@hookform/resolvers — npm](https://www.npmjs.com/package/@hookform/resolvers) — current version; README confirms Zod v4 support (`import { z } from 'zod'; // or 'zod/v4'`).
- [Zod v4 migration guide](https://zod.dev/v4/changelog) — unified `error` param, `z.email()` replacing `.email()`.
- [Zod — Customizing errors](https://zod.dev/error-customization) — syntax for positional-string and `{ error }`-object custom messages used throughout this module's schemas.
