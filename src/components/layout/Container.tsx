import { HTMLAttributes } from "react";

// The one place page max-width and horizontal padding are defined.
// Every page composes this instead of repeating "mx-auto max-w-6xl px-6".
export function Container({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`mx-auto max-w-6xl px-6 ${className}`} {...rest} />;
}
