import Link from "next/link";
import type { Metadata } from "next";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { getBrands, getCategories, getProducts } from "@/actions/products";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Button } from "@/components/ui/button";
import { SITE_DESCRIPTION } from "@/lib/site";

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    q?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const category = params.category?.trim();
  const brand = params.brand?.trim();
  const query = params.q?.trim();
  const hasFilters = Boolean(category || brand || query);
  const title = query
    ? `Resultados para ${query}`
    : brand
      ? `Ropa ${brand} en Ledesma`
      : category
        ? `Ropa por categoría en Ledesma`
        : "Tienda de ropa en Ledesma, Jujuy";
  const canonical = category
    ? `/categories/${category}`
    : brand
      ? `/brands/${encodeURIComponent(brand)}`
      : "/products";

  return {
    title,
    description: hasFilters
      ? "Explorá prendas, talles y stock disponibles en Pilchería Gloria."
      : SITE_DESCRIPTION,
    alternates: { canonical },
    robots: hasFilters ? { index: false, follow: true } : undefined,
    openGraph: hasFilters
      ? undefined
      : {
          title: "Tienda de ropa en Ledesma, Jujuy",
          description: SITE_DESCRIPTION,
          url: "/products",
        },
  };
}

function buildProductsHref(params: {
  category?: string;
  brand?: string;
  q?: string;
}) {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.brand) search.set("brand", params.brand);
  if (params.q) search.set("q", params.q);
  const query = search.toString();
  return query ? `/products?${query}` : "/products";
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const categorySlug = params.category?.trim() || undefined;
  const brand = params.brand?.trim() || undefined;
  const searchTerm = params.q?.trim() || undefined;
  const [products, categories, brands] = await Promise.all([
    getProducts({ categorySlug, brand, searchTerm }),
    getCategories(),
    getBrands(),
  ]);
  const selectedCategory = categories.find(
    (category) => category.slug === categorySlug
  );
  const activeFilterCount = [categorySlug, brand, searchTerm].filter(Boolean).length;
  const title = searchTerm
    ? `Resultados para "${searchTerm}"`
    : selectedCategory?.name || brand || "Toda la ropa";

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-gloria-50">
        <div className="container mx-auto px-4 py-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gloria-700">
            Catálogo online
          </p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-4xl text-gloria-950 sm:text-6xl">
                {title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {products.length} producto{products.length === 1 ? "" : "s"} disponible
                {products.length === 1 ? "" : "s"}
              </p>
              {!activeFilterCount ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Indumentaria y uniformes escolares con talles y stock visibles
                  en Libertador General San Martín, Ledesma.
                </p>
              ) : null}
            </div>
            {activeFilterCount ? (
              <Button variant="outline" className="w-fit rounded-full" asChild>
                <Link href="/products">
                  <X className="mr-2 size-4" />
                  Limpiar filtros
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <form action="/products" className="mb-5 flex gap-2">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <span className="sr-only">Buscar productos</span>
            <input
              name="q"
              defaultValue={searchTerm}
              placeholder="Buscar por prenda o descripción"
              className="min-h-12 w-full rounded-full border border-input bg-white pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          {categorySlug ? (
            <input type="hidden" name="category" value={categorySlug} />
          ) : null}
          {brand ? <input type="hidden" name="brand" value={brand} /> : null}
          <Button type="submit" className="min-h-12 rounded-full px-5">
            Buscar
          </Button>
        </form>

        <details className="mb-7 rounded-2xl border border-border bg-white open:pb-4 lg:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-bold">
            <SlidersHorizontal className="size-4" />
            Filtrar catálogo
            {activeFilterCount ? (
              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </summary>
          <div className="grid gap-5 border-t border-border px-4 pt-4 sm:grid-cols-2">
            <FilterGroup
              label="Categorías"
              items={categories.map((category) => ({
                label: `${category.parent_id ? "↳ " : ""}${category.name}`,
                href: buildProductsHref({
                  category: category.slug,
                  brand,
                  q: searchTerm,
                }),
                active: category.slug === categorySlug,
              }))}
            />
            <FilterGroup
              label="Marcas"
              items={brands.map((item) => ({
                label: item,
                href: buildProductsHref({
                  category: categorySlug,
                  brand: item,
                  q: searchTerm,
                }),
                active: item.toLowerCase() === brand?.toLowerCase(),
              }))}
            />
          </div>
        </details>

        <div className="grid gap-8 lg:grid-cols-[13rem_1fr]">
          <aside className="hidden space-y-7 lg:block">
            <FilterGroup
              label="Categorías"
              items={[
                {
                  label: "Todo",
                  href: buildProductsHref({ brand, q: searchTerm }),
                  active: !categorySlug,
                },
                ...categories.map((category) => ({
                  label: `${category.parent_id ? "↳ " : ""}${category.name}`,
                  href: buildProductsHref({
                    category: category.slug,
                    brand,
                    q: searchTerm,
                  }),
                  active: category.slug === categorySlug,
                })),
              ]}
            />
            {brands.length ? (
              <FilterGroup
                label="Marcas"
                items={[
                  {
                    label: "Todas",
                    href: buildProductsHref({
                      category: categorySlug,
                      q: searchTerm,
                    }),
                    active: !brand,
                  },
                  ...brands.map((item) => ({
                    label: item,
                    href: buildProductsHref({
                      category: categorySlug,
                      brand: item,
                      q: searchTerm,
                    }),
                    active: item.toLowerCase() === brand?.toLowerCase(),
                  })),
                ]}
              />
            ) : null}
          </aside>

          <section aria-label="Listado de productos">
            {products.length ? (
              <ProductGrid products={products} priorityFirst={4} />
            ) : (
              <div className="rounded-3xl border border-dashed border-gloria-300 bg-gloria-50 px-6 py-16 text-center">
                <h2 className="font-display text-2xl text-gloria-950">
                  No encontramos prendas
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                  Probá otra búsqueda o volvé al catálogo completo.
                </p>
                <Button className="mt-6 rounded-full" asChild>
                  <Link href="/products">Ver todo</Link>
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function FilterGroup({
  label,
  items,
}: {
  label: string;
  items: Array<{ label: string; href: string; active: boolean }>;
}) {
  return (
    <div>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-gloria-700">
        {label}
      </h2>
      <div className="space-y-1">
        {items.map((item) => (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            className={`flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold transition ${
              item.active
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-gloria-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
