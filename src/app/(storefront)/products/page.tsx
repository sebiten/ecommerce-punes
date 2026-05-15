import { Suspense } from "react";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getProducts } from "@/actions/products";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Productos - Pune",
  description: "Ver todos los productos de colchones y sommiers",
};

interface ProductsPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const categorySlug = params.category;
  const products = await getProducts({ categorySlug });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">
          {categorySlug ? "Categoría" : "Todos los productos"}
        </h1>
        <p className="text-muted-foreground">
          {products.length} producto{products.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 font-semibold">Categorías</h3>
            <div className="space-y-2">
              <Button
                variant={!categorySlug ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <a href="/products">Todos</a>
              </Button>
              <Button
                variant={categorySlug === "colchones" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <a href="/products?category=colchones">Colchones</a>
              </Button>
              <Button
                variant={categorySlug === "sommiers" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <a href="/products?category=sommiers">Sommiers</a>
              </Button>
              <Button
                variant={categorySlug === "accesorios" ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <a href="/products?category=accesorios">Accesorios</a>
              </Button>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-3">
          <Suspense fallback={<div>Cargando productos...</div>}>
            {products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No hay productos disponibles en este momento.
                </p>
              </div>
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}