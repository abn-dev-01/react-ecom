# Module 3 — Responsive UI (CSS + Tailwind)

## What was built

| File | Role |
|---|---|
| `src/app/globals.css` | Added `--color-brand` / `--color-brand-foreground` design tokens. |
| `src/components/layout/Header.tsx` | Sticky nav — full links at desktop width, hamburger + slide-down panel below `md`. |
| `src/components/layout/Footer.tsx` | Static site footer. |
| `src/app/cart/page.tsx` | Placeholder route so the Header's "Cart" link resolves. |
| `src/app/layout.tsx` | **Refactored** to render `<Header>` / `<Footer>` around every page. |
| `src/components/product/ProductList.tsx` | **Refactored** — grid now goes to 4 columns at `xl`. |

Every page in the app (currently just `/` and `/cart`) now gets the header and footer automatically, because they're rendered once in the root layout rather than per-page.

## Tailwind's breakpoint model: mobile-first

The single most important mental model shift in this module: **an unprefixed Tailwind class is the default for *all* screen sizes, and a breakpoint prefix (`sm:`, `md:`, `lg:`, `xl:`) overrides it starting at that width and up.** It is not "this class applies only on mobile" — it's "this class applies unless a wider breakpoint says otherwise."

```
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
```

reads as: 1 column by default, 2 columns once the viewport is ≥640px (`sm`), 3 columns once ≥1024px (`lg`), 4 columns once ≥1280px (`xl`). Nothing is written for "mobile" specifically — mobile just gets whatever has no prefix, which is why this approach is called mobile-first: you design the smallest case as the default and layer on complexity as space becomes available, rather than starting from desktop and cramming it down.

The default Tailwind breakpoints used throughout this project:

| Prefix | Min width |
|---|---|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |

## `Header.tsx` — one component, two layouts

```tsx
<nav className="hidden md:flex md:items-center md:gap-6">
  {/* desktop links */}
</nav>

<Button className="md:hidden" onClick={() => setIsMenuOpen((p) => !p)}>
  {isMenuOpen ? "✕" : "☰"}
</Button>

{isMenuOpen && (
  <nav id="mobile-nav" className="border-t border-zinc-200 md:hidden">
    {/* mobile links */}
  </nav>
)}
```

`hidden md:flex` and `md:hidden` are complementary: below 768px the desktop `<nav>` is `display: none` and the hamburger button is visible; at 768px and up, it flips — the hamburger disappears (`md:hidden`) and the desktop nav becomes a flex row (`md:flex`). Two different navigation UIs, same component, no JavaScript media-query listening required — it's declared entirely in CSS via the class list, which is both simpler and avoids a flash of the wrong layout on load.

**Why the mobile panel is conditionally rendered (`{isMenuOpen && (...)}`) instead of always in the DOM with a `hidden` class:** it's closed by default, so there's no reason to pay for its DOM nodes (or let a screen reader or `Tab` key reach its links) until it's actually open. `md:hidden` on it is a belt-and-suspenders guard for the edge case where someone opens the menu on mobile, then resizes the window past `md` without closing it first.

**Why `Header` needs `"use client"`:** `isMenuOpen` is `useState`. This is the same rule from Module 1 — any component holding state or handling clicks must be a Client Component. `Footer`, by contrast, has no interactivity and stays a Server Component.

## Design tokens in Tailwind v4

This project uses Tailwind v4, where theme customization lives directly in CSS instead of a `tailwind.config.js` file:

```css
@theme inline {
  --color-brand: #4f46e5;
  --color-brand-foreground: #ffffff;
}
```

Any `--color-*` custom property declared inside `@theme` is automatically turned into utility classes — `bg-brand`, `text-brand`, `border-brand`, etc. — the same way Tailwind's own built-in colors work. `Header.tsx` uses `text-brand` for the logo and active-link hover color. The payoff: the brand color is defined in exactly one place. Changing `#4f46e5` in `globals.css` updates every `-brand` utility across the whole app instantly — no hunting through components for a hardcoded hex value.

This is a small-scale example of the same principle Module 2's `Container` demonstrated for spacing: **a value that's meaningful to the design system (brand color, page width) gets named once, and components reference the name instead of repeating the raw value.**

## How to verify it

```
cd C:\p\study\react.p\ecom
npm run dev
```

Check at a few widths (browser dev tools' responsive mode, or just resize the window):

- **Below 768px:** header shows the "Storefront" logo and a ☰ button; tapping it slides open a nav panel with "All Products" and "Cart" links; tapping a link or the ✕ closes it.
- **768px and up:** ☰ disappears, "All Products" / "Cart" appear inline in the header.
- **Product grid:** 1 column on narrow phones, 2 columns around tablet width, 3 columns at `lg`, 4 columns at `xl` (a wide desktop window).
- Footer with the current year sits at the bottom of the viewport even on short pages (this is the `flex flex-1 flex-col` wrapper in `layout.tsx` doing its job — content grows to fill available space, pushing the footer down instead of leaving a gap above it).

## What's next — Module 4 preview

The Cart page is currently a static placeholder. Module 4 (Forms & Validation) builds the checkout address form and a variant selector, both of which will lean on `Button` and the responsive layout patterns established here.
