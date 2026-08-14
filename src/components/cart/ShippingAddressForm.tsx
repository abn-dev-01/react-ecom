"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  shippingAddressSchema,
  countries,
  ShippingAddressInput,
} from "@/lib/validation/shipping-address";
import { postJson, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

const fieldClasses =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";
const labelClasses = "mb-1 block text-sm font-medium text-zinc-700";
const errorClasses = "mt-1 text-sm text-red-600";

export function ShippingAddressForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ShippingAddressInput>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      fullName: "",
      email: "",
      addressLine1: "",
      city: "",
      postalCode: "",
      country: "US",
    },
  });

  const onSubmit = async (data: ShippingAddressInput) => {
    try {
      await postJson<{ success: true }>("/api/shipping-address", data);
      setIsSubmitted(true);
    } catch (err) {
      // Field-level errors already ran client-side via zodResolver; this
      // is a network failure or a rejection from the server's own
      // (identical) schema check — shown once, not tied to a field.
      setError("root", {
        message:
          err instanceof ApiError
            ? err.message
            : "Couldn't save shipping details. Try again.",
      });
    }
  };

  if (isSubmitted) {
    return (
      <p
        role="status"
        className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800"
      >
        Shipping details saved. Checkout continues in a later module.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex max-w-md flex-col gap-4"
      noValidate
    >
      <div>
        <label htmlFor="fullName" className={labelClasses}>
          Full name
        </label>
        <input
          id="fullName"
          type="text"
          className={fieldClasses}
          aria-invalid={errors.fullName ? "true" : "false"}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          {...register("fullName")}
        />
        {errors.fullName && (
          <p id="fullName-error" role="alert" className={errorClasses}>
            {errors.fullName.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className={labelClasses}>
          Email
        </label>
        <input
          id="email"
          type="email"
          className={fieldClasses}
          aria-invalid={errors.email ? "true" : "false"}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" role="alert" className={errorClasses}>
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="addressLine1" className={labelClasses}>
          Street address
        </label>
        <input
          id="addressLine1"
          type="text"
          className={fieldClasses}
          aria-invalid={errors.addressLine1 ? "true" : "false"}
          aria-describedby={errors.addressLine1 ? "addressLine1-error" : undefined}
          {...register("addressLine1")}
        />
        {errors.addressLine1 && (
          <p id="addressLine1-error" role="alert" className={errorClasses}>
            {errors.addressLine1.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className={labelClasses}>
            City
          </label>
          <input
            id="city"
            type="text"
            className={fieldClasses}
            aria-invalid={errors.city ? "true" : "false"}
            aria-describedby={errors.city ? "city-error" : undefined}
            {...register("city")}
          />
          {errors.city && (
            <p id="city-error" role="alert" className={errorClasses}>
              {errors.city.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="postalCode" className={labelClasses}>
            Postal code
          </label>
          <input
            id="postalCode"
            type="text"
            className={fieldClasses}
            aria-invalid={errors.postalCode ? "true" : "false"}
            aria-describedby={errors.postalCode ? "postalCode-error" : undefined}
            {...register("postalCode")}
          />
          {errors.postalCode && (
            <p id="postalCode-error" role="alert" className={errorClasses}>
              {errors.postalCode.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="country" className={labelClasses}>
          Country
        </label>
        <select
          id="country"
          className={fieldClasses}
          aria-invalid={errors.country ? "true" : "false"}
          aria-describedby={errors.country ? "country-error" : undefined}
          {...register("country")}
        >
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.label}
            </option>
          ))}
        </select>
        {errors.country && (
          <p id="country-error" role="alert" className={errorClasses}>
            {errors.country.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save shipping details"}
      </Button>

      {errors.root && (
        <p role="alert" className={errorClasses}>
          {errors.root.message}
        </p>
      )}
    </form>
  );
}
