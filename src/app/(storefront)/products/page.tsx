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
    ? "Productos que coinciden con tu búsqueda en nuestro catálogo."
    : selectedCategoryName
      ? `Selecciones de ${selectedCategoryName.toLowerCase()} pensadas para descansar mejor cada noche.`
      : "Colchones, sommiers y accesorios elegidos por soporte, confort y terminación.";
  const productCountLabel = `${products.length} producto${products.length !== 1 ? "s" : ""} disponible${products.length !== 1 ? "s" : ""}`;

  return (
    <div className="bg-[linear-gradient(180deg,#fffaf4_0%,#f8f4f0_34%,#fffaf7_100%)]">
      <section className="relative isolate overflow-hidden border-b border-[#eadfce]">
        <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-[#f6ae66]/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_70%_20%,rgba(246,174,102,0.25),transparent_42%)]" />
        <div className="container relative mx-auto px-4 py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex rounded-full border border-[#dfcbb1] bg-white/70 px-4 py-1 text-sm font-medium text-[#8b5b2f] shadow-sm">
                Descanso seleccionado por Punes
              </p>
              <h1 className="text-balance text-4xl font-black leading-[0.95] tracking-tight text-[#17110c] sm:text-5xl lg:text-6xl">
                {pageTitle}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#66584a] sm:text-lg">
                {pageDescription}
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#eadfce] bg-[#201710] p-6 text-[#fff7ea] shadow-2xl shadow-[#6b3f18]/10">
              <p className="text-sm text-[#f6ae66]">Compra tranquila</p>
              <div className="mt-5 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold">10</p>
                  <p className="text-xs text-[#fff7ea]/65">años de garantía</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">30</p>
                  <p className="text-xs text-[#fff7ea]/65">días de prueba</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">AR</p>
                  <p className="text-xs text-[#fff7ea]/65">envíos al país</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 sm:py-10">
        <div className="mb-8 flex flex-col gap-4 border-b border-[#eadfce] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#8b5b2f]">
              {productCountLabel}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#17110c]">
              {selectedCategoryName || "Todos los productos"}
            </h2>
          </div>
          {searchTerm ? (
            <div>
              <Button variant="outline" asChild>
                <Link href={categorySlug ? `/products?category=${categorySlug}` : "/products"}>
                  Limpiar búsqueda
                </Link>
              </Button>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          <aside>
            <div className="sticky top-24 rounded-[1.5rem] border border-[#eadfce] bg-white/80 p-3 shadow-sm">
              <div className="px-3 py-3">
                <h3 className="font-semibold text-[#17110c]">Categorías</h3>
                <p className="mt-1 text-sm text-[#7c6d5d]">
                  Filtra por tipo de descanso.
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
                <div className="rounded-[1.5rem] border border-[#eadfce] bg-white/75 px-6 py-16 text-center">
                  <p className="text-[#66584a]">
                    {searchTerm
                      ? "No encontramos productos para esa búsqueda."
                      : "No hay productos disponibles en este momento."}
                  </p>
                </div>
              )}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
