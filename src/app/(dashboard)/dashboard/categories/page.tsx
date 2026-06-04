import { CategoriesManager } from "@/components/dashboard/categories-manager";
import { getCategoriesAdmin } from "@/actions/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function CategoriesPage() {
  try {
    const categories = await getCategoriesAdmin();

    return <CategoriesManager initialCategories={categories} />;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudieron cargar las categorias";

    console.error("Error loading dashboard categories:", error);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">
            No se pudo cargar esta seccion del dashboard.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Error al cargar categorias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button asChild>
              <a href="/dashboard/categories">Reintentar</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}
