import { NextResponse } from "next/server";
import { createOrder } from "@/actions/orders";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, total, shippingCost, shippingMethod, shippingAddress } = body;

    const result = await createOrder({
      items,
      total,
      shippingCost,
      shippingMethod,
      shippingAddress,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Error processing checkout" },
      { status: 500 }
    );
  }
}