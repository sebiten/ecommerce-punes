import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
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

function getCategoryName(
  categories: Awaited<ReturnType<typeof getCategories>>,
  categorySlug?: string
) {
  return categories.find((category) => category.slug === categorySlug)?.name;
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
  const selectedCategoryName = getCategoryName(categories, categorySlug);
  const pageTitle = searchTerm
    ? `Resultados para "${searchTerm}"`
    : selectedCategoryName || "Colección de descanso";
  const pageDescription = searchTerm
    ? "Productos que coinciden con tu búsqueda."
    : selectedCategoryName
      ? `Selección de ${selectedCategoryName.toLowerCase()} disponible para comprar online.`
      : "Colchones, sommiers y accesorios disponibles para elegir por medida, stock y precio.";
  const productCountLabel = `${products.length} producto${products.length !== 1 ? "s" : ""} disponible${products.length !== 1 ? "s" : ""}`;

  return (
    <div className="overflow-hidden bg-[linear-gradient(180deg,#fffaf4_0%,#f8f4f0_42%,#fffaf7_100%)]">
      <section className="relative isolate overflow-hidden border-b border-[#eadfce]">
        <div className="absolute -left-28 top-6 h-56 w-56 rounded-full bg-[#f6ae66]/22 blur-3xl" />
        <div className="absolute right-[-6rem] top-[-5rem] h-64 w-64 rounded-full border border-[#f6ae66]/25" />

        <div className="container relative mx-auto px-4 py-8 sm:py-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dfcbb1] bg-[#fffdf9]/90 px-4 py-2 text-sm font-bold text-[#9a5b19] shadow-sm">
                <Sparkles className="h-4 w-4" />
                Catálogo Punes
              </p>
              <h1 className="text-balance text-4xl font-black leading-[0.95] tracking-[-0.04em] text-[#17110c] sm:text-5xl lg:text-6xl">
                {pageTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#66584a]">
                {pageDescription}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-[#eadfce] bg-[#fffdf9] px-5 py-4 shadow-sm">
              <p className="text-sm font-bold text-[#9a5b19]">
                {productCountLabel}
              </p>
              <p className="mt-1 text-sm text-[#66584a]">
                Filtrá por categoría o abrí un producto para ver medidas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-3 border-b border-[#eadfce] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-black text-[#17110c]">
            {selectedCategoryName || "Todos los productos"}
          </h2>
          {searchTerm ? (
            <Button variant="outline" asChild>
              <Link href={categorySlug ? `/products?category=${categorySlug}` : "/products"}>
                Limpiar búsqueda
              </Link>
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          <aside>
            <div className="sticky top-24 rounded-[1.5rem] border border-[#eadfce] bg-[#fffdf9]/90 p-3 shadow-sm">
              <div className="px-3 py-3">
                <h3 className="font-bold text-[#17110c]">Categorías</h3>
                <p className="mt-1 text-sm text-[#7c6d5d]">
                  Filtrá por tipo de descanso.
                </p>
              </div>
              <div className="space-y-1">
                <Button
                  variant={!categorySlug ? "secondary" : "ghost"}
                  className="w-full justify-start rounded-xl"
                  asChild
                >
                  <Link href={allProductsHref}>Todos</Link>
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={categorySlug === category.slug ? "secondary" : "ghost"}
                    className="w-full justify-start rounded-xl"
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

          <main>
            <Suspense fallback={<div>Cargando productos...</div>}>
              {products.length > 0 ? (
                <ProductGrid products={products} priorityFirst={4} />
              ) : (
                <div className="rounded-[1.5rem] border border-[#eadfce] bg-[#fffdf9] px-6 py-16 text-center">
                  <p className="text-[#66584a]">
                    {searchTerm
                      ? "No encontramos productos para esa búsqueda."
                      : "No hay productos disponibles en este momento."}
                  </p>
                  <Button className="mt-6 rounded-full" asChild>
                    <Link href="/products">Volver al catálogo</Link>
                  </Button>
                </div>
              )}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
