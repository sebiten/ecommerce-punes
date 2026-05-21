import { ProductForm } from "@/components/dashboard/product-form";
import { getCategories } from "@/actions/products";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo producto</h1>
        <p className="text-muted-foreground">
          Agrega un nuevo producto al catalogo.
        </p>
      </div>

      <ProductForm categories={categories} mode="create" />
    </div>
  );
}
