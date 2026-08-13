"use client"; // mobile menu open/closed is local UI state

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { href: "/", label: "All Products" },
  { href: "/cart", label: "Cart" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-brand">
          Storefront
        </Link>

        {/* Desktop nav: invisible below the md breakpoint, flex at md+.
            Tailwind is mobile-first — an unprefixed class is the default/
            smallest-screen behavior, and `md:` overrides it once the
            viewport is >= 768px. */}
        <nav className="hidden md:flex md:items-center md:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-700 transition-colors hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu toggle: only rendered visually below md. */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? "✕" : "☰"}
        </Button>
      </Container>

      {/* Mobile nav panel: only exists in the DOM while open, and only
          ever shown below md (md:hidden guards against a resize-while-open
          edge case where the viewport crosses the breakpoint). */}
      {isMenuOpen && (
        <nav id="mobile-nav" className="border-t border-zinc-200 md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </Container>
        </nav>
      )}
    </header>
  );
}
