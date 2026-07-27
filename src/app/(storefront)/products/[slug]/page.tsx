import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  MapPin,
  MessageCircle,
  PackageCheck,
  Shirt,
} from "lucide-react";
import { getProductBySlug } from "@/actions/products";
import { getStoreSettings } from "@/actions/store-settings";
import { formatPrice } from "@/lib/utils";
import { absoluteUrl, serializeJsonLd } from "@/lib/site";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductGallery } from "./product-gallery";
import { ProductReviews, ProductReviewSummary } from "./product-reviews";
import { ProductShareActions } from "./product-share-actions";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function getProductPrice(product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>) {
  const availablePrices = product.variants
    .filter((variant) => variant.active !== false && Number(variant.stock) > 0)
    .map((variant) => Number(variant.priceOverride ?? product.basePrice));

  return availablePrices.length
    ? Math.min(...availablePrices)
    : Number(product.basePrice);
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };

  const price = getProductPrice(product);
  const description =
    product.description?.slice(0, 155) ||
    `${product.name}${product.brand ? ` de ${product.brand}` : ""} disponible en Pilchería Gloria.`;
  const image = product.images?.[0]?.url;

  return {
    title: `${product.name}${product.brand ? ` | ${product.brand}` : ""}`,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: `${description} Precio: ${formatPrice(price)}.`,
      url: `/products/${product.slug}`,
      images: image
        ? [{ url: image, alt: product.images[0]?.alt || product.name }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getStoreSettings(),
  ]);
  if (!product) notFound();

  const activeVariants = product.variants.filter(
    (variant) => variant.active !== false
  );
  const availableStock = activeVariants.reduce(
    (sum, variant) => sum + Number(variant.stock ?? 0),
    0
  );
  const price = getProductPrice(product);
  const compareAtPrice = Number(product.compareAtPrice ?? 0);
  const isOffer = compareAtPrice > price;
  const productUrl = absoluteUrl(`/products/${product.slug}`);
  const images = product.images.map((image) => image.url);
  const fulfillmentBenefits = [
    {
      icon: Shirt,
      title: "Talles claros",
      text: "Disponibilidad visible por variante.",
    },
    ...(settings.pickup_enabled
      ? [
          {
            icon: MapPin,
            title: "Retiro coordinado",
            text: settings.pickup_instructions,
          },
        ]
      : []),
    ...(settings.local_delivery_enabled
      ? [
          {
            icon: PackageCheck,
            title: "Entrega local",
            text: "Coordinamos en Libertador y localidades cercanas.",
          },
        ]
      : []),
    {
      icon: CreditCard,
      title: "Mercado Pago",
      text: "Pago online procesado de forma segura.",
    },
  ];
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: images,
    sku: activeVariants.find((variant) => variant.sku)?.sku || undefined,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    category: product.category?.name,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "ARS",
      price,
      availability:
        availableStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <main className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
      />

      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-5 sm:py-8">
          <nav
            className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
            aria-label="Migas de pan"
          >
            <Link href="/products" className="hover:text-primary">
              Productos
            </Link>
            <span>/</span>
            {product.category ? (
              <>
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="hover:text-primary"
                >
                  {product.category.name}
                </Link>
                <span>/</span>
              </>
            ) : null}
            <span className="font-semibold text-foreground">{product.name}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="animate-gloria-rise">
              <ProductGallery
                productName={product.name}
                featured={product.featured}
                images={product.images}
              />
            </div>

            <div className="lg:sticky lg:top-24">
              <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-[0_24px_60px_-42px_oklch(0.35_0.085_134/0.4)] sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gloria-700">
                  {product.brand || product.category?.name || "Pilchería Gloria"}
                </p>
                <h1 className="mt-3 font-display text-balance text-4xl leading-[0.98] text-gloria-950 sm:text-5xl">
                  {product.name}
                </h1>
                <div className="mt-4">
                  <ProductReviewSummary productId={product.id} />
                </div>

                <div className="mb-5 flex flex-wrap items-end gap-x-4 gap-y-1 border-y border-border py-5">
                  <div>
                    {isOffer ? (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatPrice(compareAtPrice)}
                      </p>
                    ) : null}
                    <p className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                      {formatPrice(price)}
                    </p>
                  </div>
                  <span
                    className={`mb-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      availableStock > 0
                        ? "bg-green-100 text-green-800"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <CheckCircle2 className="size-3.5" />
                    {availableStock > 0 ? "Disponible" : "Sin stock"}
                  </span>
                </div>

                <p className="mb-6 leading-7 text-muted-foreground">
                  {product.description || "Descripción a completar desde el panel."}
                </p>

                <AddToCartButton
                  product={product}
                  whatsappPhone={settings.whatsapp_phone}
                  productUrl={productUrl}
                />
                <div className="mt-4 border-t border-border pt-4">
                  <ProductShareActions title={product.name} url={productUrl} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-white py-10">
        <div className="container mx-auto grid gap-6 px-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gloria-700">
              Elegí con seguridad
            </p>
            <h2 className="mt-2 font-display text-3xl text-gloria-950">
              Guía de talles
            </h2>
            {product.sizeGuide ? (
              <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {product.sizeGuide}
              </p>
            ) : (
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                Este producto todavía no tiene una tabla específica. Medí una prenda similar y consultanos antes de comprar.
              </p>
            )}
          </div>
          <Link
            href="/guia-de-talles"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-gloria-300 px-5 text-sm font-bold text-gloria-900 hover:bg-gloria-50"
          >
            Cómo tomar tus medidas
          </Link>
        </div>
      </section>

      <section className="border-b border-border bg-gloria-50 py-10">
        <div className="container mx-auto grid grid-cols-2 gap-3 px-4 lg:grid-cols-4">
          {fulfillmentBenefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article
                key={benefit.title}
                className="rounded-2xl border border-gloria-200 bg-white p-4 sm:p-5"
              >
                <Icon className="size-5 text-gloria-700" />
                <h2 className="mt-4 font-bold text-gloria-950">{benefit.title}</h2>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground sm:text-sm">
                  {benefit.text}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <ProductReviews productId={product.id} productSlug={product.slug} />
      </section>

      {settings.whatsapp_phone ? (
        <section className="bg-gloria-950 py-12 text-white">
          <div className="container mx-auto flex flex-col gap-5 px-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-3xl">¿Tenés dudas con el talle?</p>
              <p className="mt-2 text-white/65">
                Consultanos antes de comprar y te ayudamos.
              </p>
            </div>
            <Link
              href={`https://wa.me/${settings.whatsapp_phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                `Hola, quiero consultar por ${product.name}. ${productUrl}`
              )}`}
              target="_blank"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 font-bold text-gloria-950"
            >
              <MessageCircle className="mr-2 size-5" />
              Consultar por WhatsApp
            </Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}
