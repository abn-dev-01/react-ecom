# Module 2 — Reusable Components

## What changed

| File | What it is |
|---|---|
| `src/components/ui/Button.tsx` | Generic button primitive — variants, sizes, forwards a ref. |
| `src/components/ui/Card.tsx` | Compound component: `Card`, `Card.Media`, `Card.Body`. |
| `src/components/layout/Container.tsx` | Page max-width/padding wrapper, used once per page. |
| `src/components/product/ProductCard.tsx` | **Refactored** to compose `Card` + `Button` instead of raw `<div>`s. |
| `src/app/page.tsx` | **Refactored** to use `Container` instead of inline layout classes. |

Nothing changed visually — this module is about *how* the UI is built, not what it looks like. That's the point: extracting reusable pieces should be invisible to the user and safe to do at any time.

## Why extract these three specifically

`ProductCard` in Module 1 was one 45-line block mixing three concerns: card layout/border, a button's look and click behavior, and product-specific content. That's fine for one card. It stops being fine the moment Module 4 needs a "Remove item" button in the cart, or Module 6 needs a category page laid out in the same card style — copy-pasting the same `className` strings into five files is how a design drifts out of sync (one card gets updated, four don't).

The rule of thumb used here: **if a piece of UI has no idea what a "product" is, it doesn't belong in `ProductCard`.** A button and a bordered card container are generic — they get pulled out. The image, name, description, and price stay, because those genuinely are product-specific.

## `Button.tsx` — a typed wrapper, not a new API

```tsx
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", type = "button", className = "", ...rest }, ref) => {
    return <button ref={ref} type={type} className={`... ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...rest} />;
  }
);
```

Three design decisions worth naming:

1. **`extends ButtonHTMLAttributes<HTMLButtonElement>`** — instead of inventing a custom prop for every native button behavior (`onClick`, `disabled`, `aria-label`, `aria-pressed`...), the component inherits *all* of them for free. `<Button onClick={...} disabled aria-pressed={true}>` all just work, because `{...rest}` forwards whatever wasn't explicitly destructured straight onto the real `<button>`. This is the difference between wrapping the DOM element and replacing it.

2. **`forwardRef`** — by default, a function component can't receive a `ref`; the parent that renders `<Button ref={x} />` would get nothing. `forwardRef` explicitly opts the component into passing a ref through to the underlying `<button>` DOM node. Not needed yet, but cheap to add now and expected of any shared primitive (focus management, measuring size, etc. all need it eventually).

3. **`type = "button"` default** — native `<button>` defaults to `type="submit"` when there's no explicit type. That's invisible until this exact component ends up inside a `<form>` (the checkout page, Module 4) and clicking "♡" accidentally submits the form. Defaulting to `"button"` here means every future usage is safe unless a caller deliberately opts into `type="submit"`.

`Button.tsx` has `"use client"` at the top because it always ends up rendering a real `onClick` handler somewhere — it's a permanent interactivity leaf, so it's marked once here instead of on every component that happens to use it.

## `Card.tsx` — the compound component pattern

```tsx
export const Card = Object.assign(CardRoot, {
  Media: CardMedia,
  Body: CardBody,
});
```

Usage:

```tsx
<Card>
  <Card.Media>...</Card.Media>
  <Card.Body>...</Card.Body>
</Card>
```

The alternative would be one `Card` component with props like `imageSlot`, `bodySlot`, `hasBorder`, `padding`. That approach scales badly — every new layout need becomes a new prop, and the component's internals (whether media sits above or beside the body) leak into a growing prop API that's hard to remember and easy to misuse.

The compound pattern instead exposes a small set of building blocks (`Card`, `Card.Media`, `Card.Body`) that the *caller* arranges. Want no media block? Skip `<Card.Media>`. Want two body sections? Render `<Card.Body>` twice. The relationship between the pieces (they're all "Card" family) is communicated by `Card.X` dot-access, while the actual JSX structure stays fully in the caller's control. React Router's `<Tabs>`/`<Tabs.List>`/`<Tabs.Panel>` and most component libraries (Radix, Headless UI) use this exact pattern for the same reason.

`Card.tsx` has no `"use client"` — it's pure layout with no state or handlers, so it stays a Server Component. It's perfectly valid (and normal) for a Server Component like `Card` to render a Client Component like `Button` as a child, which is exactly what `ProductCard` does. The `"use client"` boundary lives at `ProductCard`/`Button`, not at `Card`.

## `Container.tsx` — one definition of "page width"

```tsx
export function Container({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`mx-auto max-w-6xl px-6 ${className}`} {...rest} />;
}
```

Before, `mx-auto max-w-6xl px-6 py-12` was typed directly into `page.tsx`. Every future page (category, cart, checkout, account) would either repeat that string or — worse — drift slightly (`max-w-6xl` on one page, `max-w-5xl` on another, purely by typo). `Container` makes "how wide is a page" a single decision, made once, changeable in one place. Page-specific spacing like `py-12` is still passed in via `className`, so `Container` only owns what's actually shared.

## What this buys us later

Module 3 (Responsive UI) will lean on these same primitives for the nav and storefront shell. Module 4's checkout form will reuse `Button` for "Place order." None of that requires touching `ProductCard` again — the primitives are already shaped for reuse, which is the actual test of whether "extracting a component" was worth doing.

## How to verify it

```
cd C:\p\study\react.p\ecom
npm run dev
```

The product grid should render identically to Module 1 — same 4 cards, same working favorite toggle. If it looks unchanged, the refactor succeeded.
