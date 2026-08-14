import { NextRequest, NextResponse } from "next/server";
import { shippingAddressSchema } from "@/lib/validation/shipping-address";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = shippingAddressSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid shipping details.", issues: result.error.issues },
      { status: 400 }
    );
  }

  await delay(500);

  return NextResponse.json({ success: true, address: result.data });
}
