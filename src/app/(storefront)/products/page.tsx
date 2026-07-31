import Link from "next/link";
import type { Metadata } from "next";
import { MessageCircle, Search, X } from "lucide-react";
import { getProducts } from "@/actions/products";
import { getStoreSettings } from "@/actions/store-settings";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Button } from "@/components/ui/button";
import { SCHOOL_UNIFORMS_DESCRIPTION } from "@/lib/site";

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const query = (await searchParams).q?.trim();

  return {
    title: query
      ? `Uniformes para ${query}`
      : "Tienda de uniformes escolares en Ledesma",
    description: SCHOOL_UNIFORMS_DESCRIPTION,
    alternates: { canonical: "/products" },
    robots: query ? { index: false, follow: true } : undefined,
    openGraph: query
      ? undefined
      : {
          title: "Tienda de uniformes escolares en Ledesma",
          description: SCHOOL_UNIFORMS_DESCRIPTION,
          url: "/products",
        },
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const searchTerm = (await searchParams).q?.trim() || undefined;
  const [products, settings] = await Promise.all([
    getProducts({
      categorySlug: "uniformes-escolares",
      searchTerm,
    }),
    getStoreSettings(),
  ]);
  const whatsappUrl = settings.whatsapp_phone
    ? `https://wa.me/${settings.whatsapp_phone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hola, busco un uniforme escolar. Escuela: ${searchTerm || "__"}. Prenda: __. Talle: __.`
      )}`
    : null;

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-gloria-50">
        <div className="container mx-auto px-4 py-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gloria-700">
            Tienda de uniformes
          </p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-4xl text-gloria-950 sm:text-6xl">
                {searchTerm ? `Resultados para “${searchTerm}”` : "Uniformes escolares"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Busque por escuela o prenda. Si no aparece, consúltenos: en el
                negocio tenemos más escuelas y talles que los publicados online.
              </p>
            </div>
            {searchTerm ? (
              <Button variant="outline" className="w-fit rounded-full" asChild>
                <Link href="/products">
                  <X className="mr-2 size-4" />
                  Ver todos
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <form action="/products" className="flex gap-2">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <span className="sr-only">Buscar por escuela o prenda</span>
            <input
              name="q"
              defaultValue={searchTerm}
              placeholder="Ej.: FASTA, Normal, chomba o remera"
              className="min-h-12 w-full rounded-full border border-input bg-white pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <Button type="submit" className="min-h-12 rounded-full px-5">
            Buscar
          </Button>
        </form>

        <div className="my-7 flex flex-col gap-4 rounded-3xl border border-gloria-200 bg-gloria-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="font-bold text-gloria-950">
              ¿Busca otra escuela o un talle que no figura?
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Escriba escuela, prenda y talle. Revisamos el stock del negocio.
            </p>
          </div>
          {whatsappUrl ? (
            <Button className="shrink-0 rounded-full" asChild>
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 size-4" />
                Consultar stock
              </a>
            </Button>
          ) : null}
        </div>

        <section aria-label="Listado de uniformes">
          {products.length ? (
            <>
              <p className="mb-5 text-sm font-semibold text-muted-foreground">
                {products.length} uniforme{products.length === 1 ? "" : "s"} disponible
                {products.length === 1 ? "" : "s"} online
              </p>
              <ProductGrid products={products} priorityFirst={4} />
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-gloria-300 bg-gloria-50 px-6 py-16 text-center">
              <h2 className="font-display text-2xl text-gloria-950">
                No está publicado, pero puede estar en el local
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                Consulte por WhatsApp y confirmamos escuela, modelo y talle.
              </p>
              {whatsappUrl ? (
                <Button className="mt-6 rounded-full" asChild>
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    Consultar disponibilidad
                  </a>
                </Button>
              ) : (
                <Button className="mt-6 rounded-full" asChild>
                  <Link href="/products">Ver todos</Link>
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
