import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Moon, Ruler, Shield, SlidersHorizontal, Sparkles, Truck } from "lucide-react";
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
    <div className="overflow-hidden bg-[linear-gradient(180deg,#fffaf4_0%,#f8f4f0_42%,#fffaf7_100%)]">
      <section className="relative isolate overflow-hidden border-b border-[#eadfce]">
        <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-[#f6ae66]/22 blur-3xl" />
        <div className="animate-punes-drift absolute right-[-8rem] top-[-6rem] h-96 w-96 rounded-full border border-[#9a5b19]/12" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_20%,rgba(246,174,102,0.22),transparent_42%)]" />

        <div className="container relative mx-auto px-4 py-14 sm:py-18">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="animate-punes-rise max-w-3xl">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dfcbb1] bg-[#fffdf9]/80 px-4 py-2 text-sm font-bold text-[#9a5b19] shadow-sm">
                <Sparkles className="h-4 w-4" />
                Descanso seleccionado por Punes
              </p>
              <h1 className="text-balance text-5xl font-black leading-[0.9] tracking-[-0.045em] text-[#17110c] sm:text-6xl lg:text-7xl">
                {pageTitle}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#66584a] sm:text-lg">
                {pageDescription}
              </p>
            </div>

            <div className="relative rounded-[2rem] border border-[#eadfce] bg-[#201710] p-6 text-[#fff7ea] shadow-2xl shadow-[#6b3f18]/10">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#f6ae66]/25 blur-2xl" />
              <p className="text-sm font-semibold text-[#ffd6a5]">Guía rápida</p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-[#fff7ea]/8 p-4">
                  <Ruler className="mb-3 h-5 w-5 text-[#ffd6a5]" />
                  <p className="text-xs text-[#fff7ea]/68">Medida exacta</p>
                </div>
                <div className="rounded-2xl bg-[#fff7ea]/8 p-4">
                  <Moon className="mb-3 h-5 w-5 text-[#ffd6a5]" />
                  <p className="text-xs text-[#fff7ea]/68">Confort diario</p>
                </div>
                <div className="rounded-2xl bg-[#fff7ea]/8 p-4">
                  <Truck className="mb-3 h-5 w-5 text-[#ffd6a5]" />
                  <p className="text-xs text-[#fff7ea]/68">Envío al país</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-[#fff7ea]/62">
                Si dudás entre medidas o firmezas, elegí el producto y revisá
                stock, variantes y beneficios antes de agregarlo al carrito.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 sm:py-10">
        <div className="mb-8 grid gap-4 border-b border-[#eadfce] pb-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-sm font-bold text-[#9a5b19]">
              {productCountLabel}
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#17110c]">
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

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#eadfce] bg-[#fffdf9] p-5 shadow-sm">
            <Shield className="mb-4 h-5 w-5 text-[#9a5b19]" />
            <p className="font-bold text-[#17110c]">Compra respaldada</p>
            <p className="mt-2 text-sm leading-6 text-[#66584a]">
              Garantía, prueba y atención antes de cerrar la compra.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[#eadfce] bg-[#fffdf9] p-5 shadow-sm">
            <SlidersHorizontal className="mb-4 h-5 w-5 text-[#9a5b19]" />
            <p className="font-bold text-[#17110c]">Variantes claras</p>
            <p className="mt-2 text-sm leading-6 text-[#66584a]">
              Medidas, stock y precio visibles antes de entrar al detalle.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[#eadfce] bg-[#fffdf9] p-5 shadow-sm">
            <Truck className="mb-4 h-5 w-5 text-[#9a5b19]" />
            <p className="font-bold text-[#17110c]">Listo para enviar</p>
            <p className="mt-2 text-sm leading-6 text-[#66584a]">
              El catálogo prioriza productos activos y disponibles.
            </p>
          </div>
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
