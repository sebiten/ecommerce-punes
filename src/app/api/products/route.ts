import { NextResponse } from "next/server";
import { createProduct } from "@/actions/products";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createProduct(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error creating product" },
      { status: 500 }
    );
  }
}