# Module 1 — React Fundamentals & Mental Model

## What was built

| File | Role |
|---|---|
| `src/types/product.ts` | `Product` TypeScript interface — the single shape everything else agrees on. |
| `src/lib/mock-products.ts` | Hardcoded array of 4 products, standing in for a real API until Module 5. |
| `src/lib/format.ts` | `formatPrice()` — turns integer cents into `"$19.99"`. |
| `src/components/product/ProductCard.tsx` | Renders one product: image, name, description, price, favorite toggle. |
| `src/components/product/ProductList.tsx` | Renders a grid of `ProductCard`s from an array of products. |
| `src/app/page.tsx` | The home route — passes `mockProducts` into `ProductList`. |

Visually: the home page (`/`) now shows a responsive grid of product cards instead of the default Next.js starter page.

## How data flows

```
mock-products.ts (data)
        │
        ▼
   page.tsx  ──renders──▶  ProductList (products prop)
                                   │
                         .map() over products
                                   │
                                   ▼
                          ProductCard (product prop) × N
```

Data only ever flows downward, from parent to child, through props. `ProductCard` never reaches "up" to ask `ProductList` or `page.tsx` for anything — it only reads what it's handed. This one-directional flow is the core of the React mental model: **UI is a function of data.** Give the same `products` array to `ProductList`, and you always get the same grid back.

## File-by-file walkthrough

### `src/types/product.ts`

```ts
export interface Product {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  imageUrl: string;
}
```

This is a TypeScript **interface**, not a React concept — but it's what makes props safe. Every component that touches a `Product` imports this one definition. If tomorrow you add a `stock: number` field, TypeScript will immediately tell you every place that needs updating. Without this, you'd be trusting that every component "just knows" a product has a `name` and a `priceInCents`, and typos (`product.Name`, `product.price`) would only surface as blank UI at runtime.

### `src/lib/mock-products.ts`

An array of 4 objects matching `Product`. The important design decision: **components don't know or care that this data is hardcoded.** `ProductList` just receives a `Product[]`. In Module 5, `mockProducts` gets replaced by the result of a `fetch()` call, and none of `ProductCard.tsx` or `ProductList.tsx` will change — they were never coupled to *where* the data came from, only to its *shape*.

### `src/lib/format.ts`

```ts
export function formatPrice(priceInCents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    priceInCents / 100
  );
}
```

Two things worth noticing:

1. **Prices are stored as integer cents** (`3200`, not `32.00`). Floating-point numbers can't represent most decimal fractions exactly, so repeated arithmetic on dollar amounts (`0.1 + 0.2` famously equals `0.30000000000000004` in JS) eventually produces off-by-a-cent bugs. Integers don't have this problem.
2. **Formatting logic lives in one function**, not inline in JSX. Any component that needs to show a price calls `formatPrice()` rather than re-implementing `Intl.NumberFormat` calls everywhere.

### `src/components/product/ProductCard.tsx`

This is the file with the most new concepts. Full relevant excerpt:

```tsx
"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/format";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <div className="...">
      <img src={product.imageUrl} alt={product.name} className="..." />
      <button onClick={() => setIsFavorited((prev) => !prev)} aria-pressed={isFavorited}>
        {isFavorited ? "♥" : "♡"}
      </button>
      <h3>{product.name}</h3>
      <p>{formatPrice(product.priceInCents)}</p>
    </div>
  );
}
```

**JSX.** The `return (...)` block looks like HTML but is not HTML — it's JSX, which compiles to `React.createElement(...)` calls. Two practical consequences:
- `{expression}` embeds real JavaScript inside markup: `{product.name}`, `{formatPrice(product.priceInCents)}`, `{isFavorited ? "♥" : "♡"}`.
- Attributes use JS naming: `className` instead of `class` (`class` is a reserved word in JS), `onClick` instead of `onclick`.

**Props.** `{ product }: ProductCardProps` destructures the single prop this component accepts. `ProductCardProps` is the contract: TypeScript will refuse to compile `<ProductCard product={someRandomThing} />` if `someRandomThing` doesn't match `Product`.

**State — `useState`.** `const [isFavorited, setIsFavorited] = useState(false)` declares one piece of state, initialized to `false`. Calling `setIsFavorited(...)` does two things: updates the value React holds for `isFavorited`, and schedules a re-render of *this component only*. Sibling `ProductCard`s don't re-render when one card's favorite is toggled — each card owns its own independent state.

Why `setIsFavorited((prev) => !prev)` instead of `setIsFavorited(!isFavorited)`? The updater-function form receives the guaranteed-current value (`prev`) at the moment the update actually runs, which matters if multiple state updates get batched together. For a single toggle like this it's a minor habit, but it's the safer default once state updates get more frequent (later modules — cart quantity, filters).

**Why `"use client"` at the top of the file.** Next.js App Router components are **Server Components by default** — they render on the server and ship no JavaScript to the browser. `useState` requires the component to run in the browser (state and event handlers only make sense client-side), so any component using hooks or `onClick` must opt in with the `"use client"` directive. `ProductList` and `page.tsx`, by contrast, have no `"use client"` — they're Server Components, meaning it's free to add many more of them later without growing the JS bundle.

**Accessibility touches.** `aria-pressed={isFavorited}` and `aria-label={...}` on the button aren't decorative — a screen reader announces the button's toggle state and purpose, not just "♡" as a glyph. This becomes a habit that pays off directly in Module 3/4 when there's real form and interaction work.

### `src/components/product/ProductList.tsx`

```tsx
export function ProductList({ products }: ProductListProps) {
  if (products.length === 0) {
    return <p>No products found.</p>;
  }

  return (
    <div className="grid ...">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

**List rendering.** `.map()` turns the `products` array into an array of `<ProductCard>` elements — JSX can render an array of elements directly.

**The `key` prop.** `key={product.id}` is not a prop `ProductCard` receives (it never appears as `props.key` inside the component) — React reads it externally to match list items across re-renders. If the list is re-ordered, filtered, or an item is removed, `key` is how React knows "this is the same card, just moved" versus "this is a new card, mount it fresh." Using the array index as a key would work today (nothing reorders yet) but breaks the moment products can be sorted or filtered — the comment left in the code flags this so it isn't missed later.

**The empty-state check.** `if (products.length === 0)` is a deliberate guard so the grid never silently renders as a blank `<div>` — a user is always told *why* they see nothing, rather than being left wondering if the page is broken.

### `src/app/page.tsx`

```tsx
import { ProductList } from "@/components/product/ProductList";
import { mockProducts } from "@/lib/mock-products";

export default function Home() {
  return (
    <main className="...">
      <h1>All Products</h1>
      <ProductList products={mockProducts} />
    </main>
  );
}
```

In the App Router, a `page.tsx` file *is* the route — `src/app/page.tsx` maps to `/`. This component has no `"use client"`, so it's a Server Component: it runs once on the server, produces HTML, and the only JavaScript sent to the browser is what `ProductCard` needs for its favorite-toggle interactivity. This mixed tree (Server Component → Server Component → Client Component leaf) is the normal Next.js pattern — push `"use client"` as far down the tree as possible, not onto whole pages.

## How to verify it

```
cd C:\p\study\react.p\ecom
npm install
npm run dev
```

Open `http://localhost:3000`. Expected: a heading "All Products" above a responsive grid (1 column on mobile, 2 on tablet, 3 on desktop per the `sm:` / `lg:` Tailwind breakpoints) of 4 cards, each with a working heart toggle that only affects that one card.

## What's next — Module 2 preview

`ProductCard` currently hardcodes its own markup and styling. Module 2 (Reusable Components) extracts generic `Button`, `Card`, and layout primitives out of it — so `ProductCard` becomes a composition of smaller pieces instead of one monolithic block, and those primitives get reused across the cart, checkout, and account pages later.
