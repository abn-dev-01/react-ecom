import { Product } from "@/types/product";

// The one place product data lives. In a real app this would be a
// database query; here it's imported directly by the Server Component
// (page.tsx, for the initial page load) and by the API route handlers
// under src/app/api/ (for client-triggered fetches). Neither caller needs
// to change if this ever becomes a real data source — they only depend on
// the Product type.
export const mockProducts: Product[] = [
  {
    id: "p1",
    name: "Everyday Canvas Tote",
    description: "A durable, minimal tote for daily use.",
    priceInCents: 3200,
    imageUrl: "https://picsum.photos/seed/p1/400/400",
    variants: ["Small", "Large"],
    stock: 8,
  },
  {
    id: "p2",
    name: "Ceramic Pour-Over Set",
    description: "Hand-glazed ceramic dripper and carafe.",
    priceInCents: 4800,
    imageUrl: "https://picsum.photos/seed/p2/400/400",
    variants: ["1-Cup", "3-Cup"],
    stock: 3,
  },
  {
    id: "p3",
    name: "Merino Wool Beanie",
    description: "Lightweight, warm, and machine washable.",
    priceInCents: 2400,
    imageUrl: "https://picsum.photos/seed/p3/400/400",
    variants: ["S/M", "L/XL"],
    stock: 6,
  },
  {
    id: "p4",
    name: "Recycled Steel Water Bottle",
    description: "Keeps drinks cold for 24 hours.",
    priceInCents: 2900,
    imageUrl: "https://picsum.photos/seed/p4/400/400",
    variants: ["18oz", "32oz"],
    stock: 2,
  },
];
