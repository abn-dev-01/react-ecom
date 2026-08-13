import { HTMLAttributes } from "react";

// Compound component pattern: Card, Card.Media, and Card.Body are always
// used together (<Card><Card.Media/><Card.Body/></Card>) but each is a
// tiny, independently styled piece. This is more flexible than one Card
// component with a dozen props like `imageUrl`, `showBorder`, `padding` —
// callers compose exactly the layout they need out of plain building blocks.

function CardRoot({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white ${className}`}
      {...rest}
    />
  );
}

function CardMedia({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`relative ${className}`} {...rest} />;
}

function CardBody({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col gap-1 p-4 ${className}`} {...rest} />;
}

export const Card = Object.assign(CardRoot, {
  Media: CardMedia,
  Body: CardBody,
});
