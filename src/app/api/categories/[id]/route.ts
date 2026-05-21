import { NextResponse } from "next/server";
import { deleteCategory, updateCategory } from "@/actions/categories";

interface CategoryRouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: CategoryRouteContext) {
  try {
    const body = await request.json();
    const { id } = await context.params;
    await updateCategory(id, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error actualizando categoria",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: CategoryRouteContext) {
  try {
    const { id } = await context.params;
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error eliminando categoria",
      },
      { status: 500 }
    );
  }
}
