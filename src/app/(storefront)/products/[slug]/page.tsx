import { notFound } from "next/navigation";
import {
  BedDouble,
  CheckCircle2,
  Moon,
  RotateCcw,
  Ruler,
  Shield,
  Sparkles,
  Truck,
} from "lucide-react";
import { getProductBySlug } from "@/actions/products";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductGallery } from "./product-gallery";
import { ProductReviews, ProductReviewSummary } from "./product-reviews";
import type { Metadata } from "next";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Producto no encontrado" };
  }

  return {
    title: product.name,
    description: product.description || `Comprar ${product.name}`,
    openGraph: {
      title: product.name,
      description: product.description || `Comprar ${product.name}`,
      images: product.images?.map((image) => image.url) ?? [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const activeVariants = product.variants.filter(
    (variant) => variant.active !== false
  );
  const availableStock = activeVariants.reduce(
    (sum, variant) => sum + Number(variant.stock ?? 0),
    0
  );

  return (
    <div className="overflow-hidden bg-[linear-gradient(180deg,#fffaf4_0%,#f8f4f0_45%,#fffdf9_100%)]">
      <section className="relative isolate border-b border-[#eadfce]">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#f6ae66]/18 blur-3xl" />
        <div className="animate-punes-drift absolute right-[-10rem] top-[-8rem] h-[28rem] w-[28rem] rounded-full border border-[#9a5b19]/12" />

        <div className="container relative mx-auto px-4 py-8 sm:py-12">
          <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-[#7c6d5d]">
            <span>Productos</span>
            <span>/</span>
            {product.category ? <span>{product.category.name}</span> : null}
            <span>/</span>
            <span className="font-semibold text-[#17110c]">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
            <div className="animate-punes-rise">
              <ProductGallery
                productName={product.name}
                featured={product.featured}
                images={product.images}
              />
            </div>

            <div className="animate-punes-rise rounded-[2rem] border border-[#eadfce] bg-[#fffdf9]/92 p-6 shadow-xl shadow-[#5c3514]/8 sm:p-8">
              {product.category ? (
                <p className="mb-3 inline-flex rounded-full bg-[#f8f0e5] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#9a5b19]">
                  {product.category.name}
                </p>
              ) : null}
              <h1 className="text-balance text-4xl font-black leading-[0.95] tracking-[-0.035em] text-[#17110c] sm:text-5xl">
                {product.name}
              </h1>

              <div className="mt-5">
                <ProductReviewSummary productId={product.id} />
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-[#eadfce] bg-[#fff8ef] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#9a5b19]">
                      Precio desde
                    </p>
                    <p className="mt-1 text-4xl font-black tracking-tight text-[#17110c]">
                      {formatPrice(Number(product.basePrice))}
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dfcbb1] bg-[#fffdf9] px-3 py-2 text-sm font-semibold text-[#5f3b18]">
                    <CheckCircle2 className="h-4 w-4 text-[#9a5b19]" />
                    {availableStock > 0 ? "Disponible" : "Consultar stock"}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-[#eadfce] bg-[#fffdf9] p-4 text-[#17110c]">
                    <Ruler className="mb-3 h-4 w-4 text-[#9a5b19]" />
                    <p className="font-bold">
                      {activeVariants.length} medida
                      {activeVariants.length !== 1 ? "s" : ""}
                    </p>
                    <p className="mt-1 text-xs text-[#66584a]">
                      Elegí la variante antes de comprar.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#eadfce] bg-[#fffdf9] p-4 text-[#17110c]">
                    <CheckCircle2 className="mb-3 h-4 w-4 text-[#9a5b19]" />
                    <p className="font-bold">
                      {availableStock > 0 ? `Stock ${availableStock}` : "A pedido"}
                    </p>
                    <p className="mt-1 text-xs text-[#66584a]">
                      Actualizado según medidas activas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="prose prose-sm mt-6 max-w-none text-[#66584a]">
                <p>{product.description || "Descripción no disponible."}</p>
              </div>

              <div className="mt-7">
                <AddToCartButton product={product} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[#eadfce] bg-[#fffdf9] p-5">
            <Truck className="mb-4 h-5 w-5 text-[#9a5b19]" />
            <h2 className="font-bold text-[#17110c]">Envío gratis</h2>
            <p className="mt-2 text-sm leading-6 text-[#66584a]">
              A todo el país en pedidos mayores a $50.000.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[#eadfce] bg-[#fffdf9] p-5">
            <Shield className="mb-4 h-5 w-5 text-[#9a5b19]" />
            <h2 className="font-bold text-[#17110c]">Garantía de 10 años</h2>
            <p className="mt-2 text-sm leading-6 text-[#66584a]">
              Respaldo extendido para comprar con tranquilidad.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[#eadfce] bg-[#fffdf9] p-5">
            <RotateCcw className="mb-4 h-5 w-5 text-[#9a5b19]" />
            <h2 className="font-bold text-[#17110c]">30 días de prueba</h2>
            <p className="mt-2 text-sm leading-6 text-[#66584a]">
              Si no te gusta, te devolvemos el dinero.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-[#eadfce] bg-[#fff8ef] p-6 text-[#17110c] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#9a5b19]">
                <Sparkles className="h-4 w-4" />
                Sensación Punes
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Pensado para que la decisión sea simple.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#eadfce] bg-[#fffdf9] p-4">
                <BedDouble className="mb-3 h-5 w-5 text-[#9a5b19]" />
                <p className="text-sm text-[#66584a]">Soporte para uso diario.</p>
              </div>
              <div className="rounded-2xl border border-[#eadfce] bg-[#fffdf9] p-4">
                <Moon className="mb-3 h-5 w-5 text-[#9a5b19]" />
                <p className="text-sm text-[#66584a]">Confort para dormir mejor.</p>
              </div>
              <div className="rounded-2xl border border-[#eadfce] bg-[#fffdf9] p-4">
                <Shield className="mb-3 h-5 w-5 text-[#9a5b19]" />
                <p className="text-sm text-[#66584a]">Compra segura y respaldada.</p>
              </div>
            </div>
          </div>
        </div>

        <ProductReviews productId={product.id} productSlug={product.slug} />
      </section>
    </div>
  );
}
