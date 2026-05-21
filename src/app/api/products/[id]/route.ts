import { NextResponse } from "next/server";
import { updateProduct } from "@/actions/products";

interface ProductRouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: ProductRouteContext) {
  try {
    const body = await request.json();
    const { id } = await context.params;

    await updateProduct(id, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error actualizando producto",
      },
      { status: 500 }
    );
  }
}
