import { Product } from "@/types/product";

// Hardcoded for Module 1. In Module 5 (Async & API Communication) this
// gets replaced by a real fetch call — the components below won't need
// to change, because they only depend on the Product type, not on where
// the data comes from.
export const mockProducts: Product[] = [
  {
    id: "p1",
    name: "Everyday Canvas Tote",
    description: "A durable, minimal tote for daily use.",
    priceInCents: 3200,
    imageUrl: "https://picsum.photos/seed/p1/400/400",
    variants: ["Small", "Large"],
  },
  {
    id: "p2",
    name: "Ceramic Pour-Over Set",
    description: "Hand-glazed ceramic dripper and carafe.",
    priceInCents: 4800,
    imageUrl: "https://picsum.photos/seed/p2/400/400",
    variants: ["1-Cup", "3-Cup"],
  },
  {
    id: "p3",
    name: "Merino Wool Beanie",
    description: "Lightweight, warm, and machine washable.",
    priceInCents: 2400,
    imageUrl: "https://picsum.photos/seed/p3/400/400",
    variants: ["S/M", "L/XL"],
  },
  {
    id: "p4",
    name: "Recycled Steel Water Bottle",
    description: "Keeps drinks cold for 24 hours.",
    priceInCents: 2900,
    imageUrl: "https://picsum.photos/seed/p4/400/400",
    variants: ["18oz", "32oz"],
  },
];
