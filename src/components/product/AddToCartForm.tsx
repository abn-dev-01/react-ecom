"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product } from "@/types/product";
import { createAddToCartSchema, AddToCartInput } from "@/lib/validation/add-to-cart";
import { postJson, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

interface AddToCartFormProps {
  product: Product;
}

const fieldClasses =
  "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";
const labelClasses = "mb-1 block text-xs font-medium text-zinc-700";
const errorClasses = "mt-1 text-xs text-red-600";

interface AddToCartResponse {
  success: true;
  cartItem: {
    productId: string;
    productName: string;
    variant: string;
    quantity: number;
  };
}

export function AddToCartForm({ product }: AddToCartFormProps) {
  const [confirmation, setConfirmation] = useState<string | null>(null);
  // Built once per render from this product's own variants — see
  // add-to-cart.ts for why this is a factory rather than a static schema.
  const schema = createAddToCartSchema(product.variants);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddToCartInput>({
    resolver: zodResolver(schema),
    defaultValues: { variant: product.variants[0], quantity: 1 },
  });

  // Two different kinds of failure, shown two different ways:
  // - errors.variant / errors.quantity: caught by Zod before any request
  //   is sent — the user can fix these by editing the field they're on.
  // - root error (set below): the request reached the server and it said
  //   no (out of stock, network hiccup). Not tied to one field, so it's
  //   shown once, near the submit button.
  const onSubmit = async (data: AddToCartInput) => {
    setConfirmation(null);
    try {
      const response = await postJson<AddToCartResponse>("/api/cart", {
        productId: product.id,
        variant: data.variant,
        quantity: data.quantity,
      });
      setConfirmation(
        `Added ${response.cartItem.quantity} × ${response.cartItem.productName} (${response.cartItem.variant}).`
      );
      reset({ variant: data.variant, quantity: 1 });
    } catch (err) {
      setError("root", {
        message:
          err instanceof ApiError ? err.message : "Couldn't add to cart. Try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <div>
        <label htmlFor={`variant-${product.id}`} className={labelClasses}>
          Option
        </label>
        <select
          id={`variant-${product.id}`}
          className={fieldClasses}
          aria-invalid={errors.variant ? "true" : "false"}
          aria-describedby={errors.variant ? `variant-error-${product.id}` : undefined}
          {...register("variant")}
        >
          {product.variants.map((variant) => (
            <option key={variant} value={variant}>
              {variant}
            </option>
          ))}
        </select>
        {errors.variant && (
          <p id={`variant-error-${product.id}`} role="alert" className={errorClasses}>
            {errors.variant.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`quantity-${product.id}`} className={labelClasses}>
          Quantity
        </label>
        <input
          id={`quantity-${product.id}`}
          type="number"
          min={1}
          max={10}
          className={fieldClasses}
          aria-invalid={errors.quantity ? "true" : "false"}
          aria-describedby={errors.quantity ? `quantity-error-${product.id}` : undefined}
          {...register("quantity", { valueAsNumber: true })}
        />
        {errors.quantity && (
          <p id={`quantity-error-${product.id}`} role="alert" className={errorClasses}>
            {errors.quantity.message}
          </p>
        )}
      </div>

      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Adding…" : "Add to Cart"}
      </Button>

      {errors.root && (
        <p role="alert" className={errorClasses}>
          {errors.root.message}
        </p>
      )}

      {confirmation && (
        <p role="status" className="text-xs text-green-700">
          {confirmation}
        </p>
      )}
    </form>
  );
}
