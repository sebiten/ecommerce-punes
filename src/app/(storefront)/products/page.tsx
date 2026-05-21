import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getCategories, getProducts } from "@/actions/products";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Productos - Pune",
  description: "Ver todos los productos de colchones y sommiers",
};

interface ProductsPageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const categorySlug = params.category;
  const searchTerm = params.q?.trim() || undefined;
  const [products, categories] = await Promise.all([
    getProducts({ categorySlug, searchTerm }),
    getCategories(),
  ]);

  const allProductsHref = searchTerm
    ? `/products?q=${encodeURIComponent(searchTerm)}`
    : "/products";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">
          {searchTerm
            ? `Resultados para "${searchTerm}"`
            : categorySlug
              ? "Categoria"
              : "Todos los productos"}
        </h1>
        <p className="text-muted-foreground">
          {products.length} producto{products.length !== 1 ? "s" : ""}
        </p>
        {searchTerm ? (
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href={categorySlug ? `/products?category=${categorySlug}` : "/products"}>
                Limpiar busqueda
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 font-semibold">Categorias</h3>
            <div className="space-y-2">
              <Button
                variant={!categorySlug ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href={allProductsHref}>Todos</Link>
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={categorySlug === category.slug ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  asChild
                >
                  <Link
                    href={
                      searchTerm
                        ? `/products?category=${category.slug}&q=${encodeURIComponent(searchTerm)}`
                        : `/products?category=${category.slug}`
                    }
                  >
                    {category.name}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </aside>

        <main className="lg:col-span-3">
          <Suspense fallback={<div>Cargando productos...</div>}>
            {products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "No encontramos productos para esa busqueda."
                    : "No hay productos disponibles en este momento."}
                </p>
              </div>
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
