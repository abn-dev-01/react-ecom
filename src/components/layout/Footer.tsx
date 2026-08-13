import { Container } from "@/components/layout/Container";

// No "use client" — this is static per request and can stay a Server
// Component. new Date() here runs once on the server per render; it's
// safe (no hydration mismatch risk) specifically because nothing in this
// component ever re-renders on the client.
export function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-8 text-sm text-zinc-500">
      <Container>
        <p>&copy; {new Date().getFullYear()} Storefront. Built for learning.</p>
      </Container>
    </footer>
  );
}
