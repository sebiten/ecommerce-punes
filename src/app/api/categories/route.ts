import { NextResponse } from "next/server";
import { createCategory } from "@/actions/categories";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const category = await createCategory(body);
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error creando categoría",
      },
      { status: 500 }
    );
  }
}
