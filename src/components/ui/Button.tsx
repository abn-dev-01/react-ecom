"use client"; // renders a native <button> and accepts event handlers — always an interactivity leaf

import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-800",
  secondary:
    "bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-50",
  ghost: "bg-transparent text-zinc-900 hover:bg-zinc-100",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

// forwardRef so parents can grab the underlying <button> DOM node
// (needed later for things like focus management in forms/modals).
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", type = "button", className = "", ...rest },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...rest}
      />
    );
  }
);

Button.displayName = "Button";
