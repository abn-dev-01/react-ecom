import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ShippingAddressForm } from "@/components/cart/ShippingAddressForm";

function stubFetchOnce(response: { ok: boolean; status?: number; body: unknown }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 400),
    json: async () => response.body,
  } as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Full name"), "Ada Lovelace");
  await user.type(screen.getByLabelText("Email"), "ada@example.com");
  await user.type(screen.getByLabelText("Street address"), "123 Analytical Engine Ave");
  await user.type(screen.getByLabelText("City"), "London");
  await user.type(screen.getByLabelText("Postal code"), "SW1A1AA");
  // Country is left at its default ("United States") — a <select> is
  // never "empty," so there's no empty-country case to test here.
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ShippingAddressForm", () => {
  it("shows a validation error per empty required field and never calls the API", async () => {
    const fetchMock = stubFetchOnce({ ok: true, body: { success: true } });
    const user = userEvent.setup();
    render(<ShippingAddressForm />);

    await user.click(screen.getByRole("button", { name: "Save shipping details" }));

    expect(await screen.findByText("Enter your full name")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Enter your street address")).toBeInTheDocument();
    expect(screen.getByText("Enter your city")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid postal code")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits valid data and replaces the form with a confirmation on success", async () => {
    const fetchMock = stubFetchOnce({ ok: true, body: { success: true } });
    const user = userEvent.setup();
    render(<ShippingAddressForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Save shipping details" }));

    expect(
      await screen.findByText(
        "Shipping details saved. Checkout continues in a later module."
      )
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/shipping-address",
      expect.objectContaining({ method: "POST" })
    );
    // The form itself is gone once submitted successfully.
    expect(
      screen.queryByRole("button", { name: "Save shipping details" })
    ).not.toBeInTheDocument();
  });

  it("shows a root-level error when the server rejects the request, and keeps the form visible", async () => {
    stubFetchOnce({ ok: false, status: 400, body: { error: "Invalid shipping details." } });
    const user = userEvent.setup();
    render(<ShippingAddressForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Save shipping details" }));

    expect(await screen.findByText("Invalid shipping details.")).toBeInTheDocument();
    // Unlike a client validation error, a server rejection doesn't wipe
    // the form — the user's input (and the retry button) are still there.
    expect(
      screen.getByRole("button", { name: "Save shipping details" })
    ).toBeInTheDocument();
  });

  it("disables the submit button and shows pending text while the request is in flight", async () => {
    let resolveFetch!: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending));

    const user = userEvent.setup();
    render(<ShippingAddressForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Save shipping details" }));

    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();

    resolveFetch({ ok: true, status: 200, json: async () => ({ success: true }) });

    await waitFor(() => {
      expect(
        screen.getByText("Shipping details saved. Checkout continues in a later module.")
      ).toBeInTheDocument();
    });
  });
});
