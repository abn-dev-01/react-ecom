"use client";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

// A "dumb" controlled input — it holds no state of its own and knows
// nothing about fetching or debouncing. That logic lives in
// useProductSearch, so this component stays trivial to read and reuse.
export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="mb-6">
      <label htmlFor="product-search" className="sr-only">
        Search products
      </label>
      <input
        id="product-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search products…"
        className="w-full max-w-sm rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
    </div>
  );
}
