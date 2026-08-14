# Module 5 — Async & API Communication

## What was built

| File | Role |
|---|---|
| `src/app/api/products/route.ts` | GET — returns the catalog, optionally filtered by `?q=`. |
| `src/app/api/cart/route.ts` | POST — re-validates and "adds to cart" server-side. |
| `src/app/api/shipping-address/route.ts` | POST — re-validates the shipping form server-side. |
| `src/lib/api-client.ts` | `getJson` / `postJson` — shared fetch wrapper, throws a typed `ApiError`. |
| `src/lib/hooks/useProductSearch.ts` | Debounce + cache + cancellation for the search box. |
| `src/components/product/SearchBar.tsx` | Controlled input, no logic of its own. |
| `src/components/product/ProductCatalog.tsx` | Owns search state, renders loading/error/results. |
| `src/components/product/AddToCartForm.tsx`, `src/components/cart/ShippingAddressForm.tsx` | **Refactored** — now call real API routes instead of faking submission. |
| `src/types/product.ts`, `src/lib/mock-products.ts` | Added `stock: number` per product. |

## The backend is real, just local

`src/app/api/*/route.ts` files are Next.js **Route Handlers** — actual server endpoints, not mocked promises. `GET`/`POST` exported from `route.ts` run on the server and are reachable at the matching URL (`src/app/api/products/route.ts` → `/api/products`). Every `fetch()` in this module hits one of these for real, over HTTP, in the same dev server. This matters pedagogically: the loading states, error handling, and race conditions built here are the same ones a real backend would produce — nothing about them is faked, only the data source behind the route (`mockProducts` instead of a database) is.

## Client validation is UX; server validation is the boundary

`src/app/api/cart/route.ts` re-runs `createAddToCartSchema(product.variants).safeParse(...)` on the request body — the exact same schema `AddToCartForm.tsx` already checked client-side. This looks redundant until you consider: the client's Zod check only stops *this form*. The API route can be reached by anyone — curl, a browser extension, a malicious script — bypassing the form entirely. **Client-side validation is there to give a user instant feedback without a round trip; server-side validation is what actually protects the data.** Skipping the server check because "the form already validates it" is a common and serious mistake.

The stock check makes the distinction concrete:

```ts
// api/cart/route.ts
if (result.data.quantity > product.stock) {
  return NextResponse.json({ error: `Only ${product.stock} left in stock.` }, { status: 409 });
}
```

The client's schema caps quantity at 10 for sanity, but has no way to know a product only has 2 left — that number only exists on the server. Try ordering 3 of the water bottle (`stock: 2`) to see this rejection.

## `api-client.ts` — one fetch wrapper, not one per component

Every fetch call needs the same handling: parse the response as JSON, check `response.ok`, and turn a failure into something a `catch` block can use. Writing that inline in every form would mean three or four near-identical `try`/`catch` blocks across the codebase. `getJson`/`postJson` do it once:

```ts
export async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const response = await fetch(url, { method: "POST", headers: {...}, body: JSON.stringify(body) });
  const data = await parseJsonSafely(response);
  if (!response.ok) {
    throw new ApiError(data?.error ?? "Request failed.", response.status, data);
  }
  return data as TResponse;
}
```

Components call `postJson<AddToCartResponse>("/api/cart", {...})` and only need to handle two outcomes: it resolves (success), or it throws an `ApiError` (failure, with a `.message` already extracted from the server's response).

## Two kinds of form error, shown two different ways

`AddToCartForm` and `ShippingAddressForm` both distinguish:

- **Field errors** (`errors.variant`, `errors.email`, ...) — caught by Zod before any request is sent. Shown right next to the field that's wrong, because the fix is "edit that field."
- **Root errors** (`errors.root`, set via `setError("root", { message })`) — the request reached the server and failed there (stock exceeded, network down). Not tied to any one field, so it's shown once, near the submit button.

```ts
try {
  const response = await postJson<AddToCartResponse>("/api/cart", { ... });
  setConfirmation(`Added ${response.cartItem.quantity} × ...`);
} catch (err) {
  setError("root", {
    message: err instanceof ApiError ? err.message : "Couldn't add to cart. Try again.",
  });
}
```

`isSubmitting` from React Hook Form's `formState` already covers the loading state here — because `onSubmit` is `async` and returns a promise, RHF automatically flips `isSubmitting` true while it's pending. No extra `useState` needed for that part.

## `useProductSearch` — debounce, cache, and a real race condition

This hook is the most involved piece of the module. Three separate problems, each solved by a different technique:

**1. Debounce.** Typing "shirt" character by character shouldn't fire five requests. A `setTimeout` is (re)scheduled on every keystroke via the effect's cleanup function, which clears the previous timer before the new one is set:

```ts
const timeoutId = setTimeout(() => { /* fetch */ }, 300);
return () => clearTimeout(timeoutId);
```

Only once 300ms pass without another keystroke does the timer actually fire.

**2. Cache.** A module-level `Map<string, Product[]>` remembers past search results for the life of the page. Searching "tote", clearing the box, then typing "tote" again returns instantly from the cache instead of re-hitting `/api/products`. This is a simplified version of what libraries like React Query or SWR do automatically (plus request deduplication, background revalidation, and more) — worth knowing this manually before reaching for a library that hides it.

**3. Cancellation — the actual race condition.** Without it: type "s", a request for "s" starts (500ms simulated latency). Before it resolves, type "sh" — a second request starts. Network timing is not guaranteed to match request order — the "s" response can arrive *after* the "sh" response, overwriting the correct, newer results with stale ones for a query that no longer matches the input box. `AbortController` fixes this:

```ts
const controller = new AbortController();
getJson(url, controller.signal).then(...).catch((err) => {
  if (controller.signal.aborted) return; // superseded — ignore
  ...
});
return () => controller.abort();
```

Every effect run gets its own controller. When a newer keystroke causes the effect to re-run, cleanup aborts the *previous* controller — so a late-arriving stale response is caught, recognized as aborted, and discarded instead of overwriting the current results.

## How to verify it

```
cd C:\p\study\react.p\ecom
npm install
npm run dev
```

- **Search:** type in the search box on `/`. Below 300ms of no typing, "Searching…" appears briefly, then results filter. Search the same term twice — the second time should feel instant (cache hit, no "Searching…" flash).
- **Search error:** type the literal word `error` into the search box — this is a deliberate trigger for the simulated 500 response, so the red error state is reachable without a real network failure.
- **Stock limit:** on the "Ceramic Pour-Over Set" card (stock: 3), try adding 4 — should reject with "Only 3 left in stock." after a short delay, distinct from the instant client-side quantity-range error you'd get entering 11.
- **Shipping form:** submit `/cart` with valid data — after a brief delay, it should show the success message, exactly as before, but now genuinely round-tripped through `/api/shipping-address`.

## What's next — Module 6 preview

`page.tsx` still imports `mockProducts` directly for the initial render, and `/cart` has no real cart *contents* yet. Module 6 (Next.js App Router & Data Fetching) formalizes how Server Components fetch data (including caching/revalidation strategies), and adds dedicated product and category pages with dynamic routing.
