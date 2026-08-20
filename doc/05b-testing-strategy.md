# Testing Strategy — pulled forward to satisfy the external curriculum's Module 5

## Why this doc exists, and why it's numbered "05b"

The pasted external requirements document's "Module 5 — Testing Strategy" doesn't match this project's own `STUDY_PLAN.md`, where Module 5 is "Async & API Communication" and testing is Module 8. Per your instruction, testing was pulled forward now rather than waiting for Module 8, so this document covers that work directly. `STUDY_PLAN.md` is intentionally left showing Module 8 as still open — the tooling and initial test coverage built here is the foundation Module 8 will expand on once Modules 6 and 7 add more to test.

## New dependencies

Added to `package.json` as `devDependencies` (run `npm install`):

| Package | Version | Role |
|---|---|---|
| `vitest` | `^4.1.10` | Test runner (Vite-native — fast, ESM-first). |
| `@vitejs/plugin-react` | `^6.0.5` | Lets Vitest compile JSX/TSX. |
| `vite` | `^8.2.1` | Peer dependency of both of the above. |
| `@testing-library/react` | `^16.3.2` | Renders components into jsdom; `render`, `renderHook`. |
| `@testing-library/dom` | `^10.4.1` | Peer dependency of `@testing-library/react`. |
| `@testing-library/jest-dom` | `^7.0.1` | Adds matchers like `.toBeInTheDocument()`, `.toBeDisabled()`. |
| `@testing-library/user-event` | `^14.6.4` | Simulates real user interaction (typing, clicking, selecting). |
| `jsdom` | `^30.0.1` | Browser-like DOM environment the tests run in. |

All versions were confirmed against the live npm registry at the time of writing, not assumed.

New scripts: `npm test` (runs once, for CI/verification) and `npm run test:watch` (interactive).

## What was built

| File | Role |
|---|---|
| `vitest.config.ts` | Test runner config — jsdom environment, `@/*` path alias, setup file. |
| `vitest.setup.ts` | Loads jest-dom matchers globally. |
| `src/components/product/AddToCartForm.test.tsx` | Form submission, client validation, server error, loading state. |
| `src/components/cart/ShippingAddressForm.test.tsx` | Same coverage for the shipping form. |
| `src/lib/hooks/useProductSearch.test.ts` | Loading state, error state, and caching, tested directly on the hook. |

## An important limitation, stated plainly

I could not run `npm install` or `npm test` myself to confirm these tests pass — this sandbox's filesystem is extremely slow for bulk operations on your project folder (the same constraint that made earlier `npm install` runs take many minutes; documented in the Module 1 setup conversation). Every test here follows well-established, standard Vitest/Testing Library patterns, and I traced each one against the actual component/hook source line by line while writing it — but "should be correct by careful inspection" is not the same as "verified by running." **Please run `npm install && npm test` and tell me the result.** If anything fails, paste the output and I'll fix it — that's a normal, expected step here, not a sign something went wrong with the approach.

## Behavior-driven, not implementation-driven

Every test interacts with components the way a user would — `userEvent.click`, `userEvent.type`, `userEvent.selectOptions` — and asserts on what's visible: text on screen, a button's disabled state, an element's accessible role. None of the tests reach into component internals (no checking React state directly, no calling `onSubmit` as a plain function). This is the Testing Library philosophy in one sentence: **the more your tests resemble the way your software is used, the more confidence they give you.** A refactor that changes *how* `AddToCartForm` is built internally, without changing what the user sees or does, shouldn't break these tests.

## Mocking the API boundary, not the whole component

Every test stubs `global.fetch` with `vi.stubGlobal("fetch", ...)`:

```ts
function stubFetchOnce(response: { ok: boolean; status?: number; body: unknown }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 400),
    json: async () => response.body,
  } as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
```

This is deliberately the *only* thing mocked. `AddToCartForm`, `zodResolver`, `postJson` — all real. The test exercises the actual validation logic, the actual `api-client.ts` response handling, the actual React Hook Form wiring; only the network call itself (which would otherwise hit a real, possibly-unavailable server) is faked. This is the standard boundary to mock in frontend tests: **mock I/O, not your own code.**

## Testing loading states without flaky timing

The naive way to test a pending state (`await user.click(button); expect(button).toBeDisabled()`) is a race condition — if the mocked fetch resolves instantly (as `mockResolvedValue` does by default), the component may have already re-rendered past the loading state before the assertion runs. Every loading-state test in this module instead holds the promise open deliberately:

```ts
let resolveFetch!: (value: unknown) => void;
const pending = new Promise((resolve) => { resolveFetch = resolve; });
vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending));

await user.click(screen.getByRole("button", { name: "Add to Cart" }));
expect(await screen.findByRole("button", { name: "Adding…" })).toBeDisabled();

resolveFetch({ ok: true, json: async () => ({ ... }) }); // now let it finish
await waitFor(() => { /* assert the post-resolution state */ });
```

The test controls exactly when the "request" completes, so the pending state is guaranteed observable, not just probable.

## Testing the hook directly vs. testing it through the UI

`useProductSearch.test.ts` uses `renderHook` to test the hook in isolation, rather than typing into the search box and waiting for the debounce through the full `ProductCatalog` component tree. This is a deliberate scope decision: the hook owns the actual async logic (debounce, cache, cancellation) — testing it directly makes failures point at the right place immediately, and keeps the test independent of `SearchBar`'s markup. `ProductCatalog` itself is thin enough (it just renders whatever the hook returns) that it doesn't need its own dedicated test file yet; if it grows more UI logic later, it should get one.

The cache test is the one worth reading closely:

```ts
rerender({ query: "uniquecachekey" });
await waitFor(() => expect(result.current.products).toEqual(cachedProducts));
expect(fetchMock).toHaveBeenCalledTimes(1);

rerender({ query: "" });
rerender({ query: "uniquecachekey" }); // same term again

await waitFor(() => expect(result.current.products).toEqual(cachedProducts));
expect(fetchMock).toHaveBeenCalledTimes(1); // still 1 — served from cache
```

Asserting on `result.current.products` (not `isLoading`) inside `waitFor` is deliberate: `isLoading` starts `false` and would make a `waitFor(() => expect(isLoading).toBe(false))` pass immediately, before the fetch even ran — a false-positive "pass" that doesn't actually wait for anything. Waiting for the *end state that can only exist after a real update* is what makes the assertion meaningful.

## How to run it

```
cd C:\p\study\react.p\ecom
npm install
npm test
```

For a watch mode while working: `npm run test:watch`.

Expected: 4 tests in `AddToCartForm.test.tsx`, 4 in `ShippingAddressForm.test.tsx`, 4 in `useProductSearch.test.ts` — 12 total, all passing. The hook test file will visibly take the longest (roughly a second or two) because two of its tests really wait out the 300ms debounce rather than faking the clock — see the trade-off note at the top of that file.
