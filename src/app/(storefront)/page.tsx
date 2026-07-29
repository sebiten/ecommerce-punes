import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CreditCard,
  MapPin,
  MessageCircle,
  PackageCheck,
} from "lucide-react";
import { getProducts } from "@/actions/products";
import { getStoreSettings } from "@/actions/store-settings";
import { ProductGrid } from "@/components/storefront/product-grid";
import { PaymentConfidence } from "@/components/storefront/payment-confidence";
import { SchoolUniformsCarousel } from "@/components/storefront/school-uniforms-carousel";
import { Button } from "@/components/ui/button";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: "Uniformes escolares en Ledesma, Jujuy",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Uniformes escolares en Ledesma, Jujuy",
    description: SITE_DESCRIPTION,
    url: "/",
  },
};

const EDITORIAL_IMAGES = {
  hero: "https://images.unsplash.com/photo-1767968037382-8eb9c564339f?auto=format&fit=crop&w=1600&q=86",
  woman:
    "https://images.unsplash.com/photo-1759163120690-b09c674bab82?auto=format&fit=crop&w=900&q=84",
  man: "https://images.unsplash.com/photo-1762316984079-f94002fbdc46?auto=format&fit=crop&w=900&q=84",
  store:
    "https://images.unsplash.com/photo-1766934587214-86e21b3ae093?auto=format&fit=crop&w=1100&q=84",
  uniforms:
    "https://images.unsplash.com/photo-1759143101324-d375443f1955?auto=format&fit=crop&w=1100&q=84",
};

const collectionLinks = [
  {
    title: "Uniformes",
    eyebrow: "Vuelta al cole",
    href: "/uniformes-escolares-ledesma",
    image: EDITORIAL_IMAGES.uniforms,
  },
  {
    title: "Mujer",
    eyebrow: "Colección",
    href: "/categories/mujer",
    image: EDITORIAL_IMAGES.woman,
  },
  {
    title: "Hombre",
    eyebrow: "Colección",
    href: "/categories/hombre",
    image: EDITORIAL_IMAGES.man,
  },
  {
    title: "Remeras",
    eyebrow: "Todos los días",
    href: "/products?q=remera",
    image: EDITORIAL_IMAGES.store,
  },
  {
    title: "Jeans",
    eyebrow: "Tu próximo favorito",
    href: "/products?q=jean",
    image: EDITORIAL_IMAGES.hero,
  },
];

export default async function HomePage() {
  const [products, schoolUniformProducts, settings] = await Promise.all([
    getProducts({ limit: 12 }),
    getProducts({ categorySlug: "uniformes-escolares", limit: 8 }),
    getStoreSettings(),
  ]);
  const featuredProducts = products.filter((product) => product.featured).slice(0, 8);
  const offers = products
    .filter(
      (product) =>
        product.compareAtPrice &&
        Number(product.compareAtPrice) > Number(product.basePrice)
    )
    .slice(0, 8);
  const showcasingUniforms = schoolUniformProducts.length > 0;
  const showcaseProducts = showcasingUniforms
    ? schoolUniformProducts
    : featuredProducts.length
      ? featuredProducts
      : products.slice(0, 8);
  const hasWhatsapp = Boolean(settings.whatsapp_phone);
  const whatsappUrl = hasWhatsapp
    ? `https://wa.me/${settings.whatsapp_phone?.replace(/\D/g, "")}?text=${encodeURIComponent(
        "Hola, quiero consultar por las prendas disponibles en Pilchería Gloria."
      )}`
    : null;
  const fulfillmentCopy =
    settings.pickup_enabled && settings.local_delivery_enabled
      ? "retiralo en el local o elegí entrega en la zona"
      : settings.pickup_enabled
        ? "retiralo en el local después de nuestra confirmación"
        : "coordiná la entrega local";
  const fulfillmentCards = [
    ...(settings.pickup_enabled
      ? [["Retiro", "Previa confirmación", MapPin] as const]
      : []),
    ...(settings.local_delivery_enabled
      ? [["Entrega", "En la zona", PackageCheck] as const]
      : []),
    ["Pago", "Mercado Pago", CreditCard] as const,
    ["Consulta", "Por WhatsApp", MessageCircle] as const,
  ];
  return (
    <main className="overflow-hidden bg-background">
      <section className="relative isolate border-b border-border bg-gloria-50">
        <div className="absolute -left-32 top-16 size-72 rounded-full bg-gloria-200/70 blur-3xl" />
        <div className="container relative mx-auto grid min-h-[calc(100svh-4rem)] items-center gap-8 px-4 py-10 lg:grid-cols-[0.88fr_1.12fr] lg:py-14">
          <div className="animate-gloria-rise z-10 max-w-2xl">
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-gloria-700">
              Uniformes escolares en Ledesma
            </p>
            <h1 className="font-display text-balance text-5xl leading-[0.94] tracking-[-0.045em] text-gloria-950 sm:text-7xl lg:text-[5.6rem]">
              Todo el uniforme. Un solo lugar.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Remeras, camisas, pantalones y medias para primaria y secundaria.
              Elegí el talle online y {fulfillmentCopy}.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="min-h-12 rounded-full bg-gloria-500 px-7 text-gloria-950 hover:bg-gloria-400"
                asChild
              >
                <Link href="/uniformes-escolares-ledesma">
                  Buscar por escuela
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-12 rounded-full border-gloria-300 bg-white px-7 text-gloria-800"
                asChild
              >
                <Link href="/products">Ver toda la ropa</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-gloria-900">
              <span className="inline-flex items-center gap-2">
                <PackageCheck className="size-4 text-gloria-600" />
                Talles infantil, juvenil y adulto
              </span>
              {settings.pickup_enabled ? (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="size-4 text-gloria-600" />
                  Retiro coordinado
                </span>
              ) : null}
              {settings.local_delivery_enabled ? (
                <span className="inline-flex items-center gap-2">
                  <PackageCheck className="size-4 text-gloria-600" />
                  Entrega local
                </span>
              ) : null}
              <span className="inline-flex items-center gap-2">
                <CreditCard className="size-4 text-gloria-600" />
                Mercado Pago
              </span>
            </div>
          </div>

          <div className="relative min-h-[34rem] sm:min-h-[42rem]">
            <div className="absolute inset-y-0 right-0 w-[88%] overflow-hidden rounded-[2.5rem_0.8rem_2.5rem_0.8rem] bg-gloria-100 shadow-[0_35px_80px_-45px_oklch(0.35_0.085_134/0.5)]">
              <Image
                src={EDITORIAL_IMAGES.uniforms}
                alt="Uniformes escolares para primaria y secundaria"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 56vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gloria-950/45 via-transparent to-transparent" />
            </div>
            <div className="animate-gloria-float absolute bottom-8 left-0 max-w-[15rem] rounded-3xl border border-gloria-200 bg-white p-5 shadow-xl">
              <p className="font-display text-2xl text-gloria-950">
                Decinos tu escuela.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Confirmamos modelo, talle y stock antes de preparar el pedido.
              </p>
            </div>
          </div>
        </div>
      </section>

      <PaymentConfidence />

      <SchoolUniformsCarousel whatsappPhone={settings.whatsapp_phone} />

      <section className="container mx-auto px-4 py-16 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-gloria-700">
              Entrá por donde quieras
            </p>
            <h2 className="mt-2 font-display text-3xl text-gloria-950 sm:text-5xl">
              Colecciones
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden items-center gap-2 font-bold text-gloria-800 hover:text-gloria-600 sm:flex"
          >
            Ver todo <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {collectionLinks.map((collection, index) => (
            <Link
              key={collection.title}
              href={collection.href}
              className={`group relative overflow-hidden rounded-[1.5rem] ${
                index === 0 ? "col-span-2 aspect-[16/11] lg:col-span-1 lg:aspect-[4/5]" : "aspect-[4/5]"
              }`}
            >
              <Image
                src={collection.image}
                alt={`Indumentaria de ${collection.title.toLowerCase()}`}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.04]"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gloria-950/75 via-transparent to-transparent" />
              <div className="absolute inset-x-4 bottom-4 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gloria-100">
                  {collection.eyebrow}
                </p>
                <h3 className="mt-1 font-display text-2xl sm:text-3xl">
                  {collection.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-white py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-gloria-700">
                {showcasingUniforms ? "Por escuela y talle" : "Recién elegidos"}
              </p>
              <h2 className="mt-2 font-display text-3xl text-gloria-950 sm:text-5xl">
                {showcasingUniforms
                  ? "Uniformes escolares disponibles"
                  : "Prendas destacadas"}
              </h2>
            </div>
            <Button variant="outline" className="hidden rounded-full sm:flex" asChild>
              <Link href="/products">Catálogo completo</Link>
            </Button>
          </div>
          {showcaseProducts.length ? (
            <ProductGrid products={showcaseProducts} priorityFirst={4} />
          ) : (
            <div className="rounded-3xl border border-dashed border-gloria-300 bg-gloria-50 px-6 py-14 text-center">
              <p className="font-display text-2xl text-gloria-950">
                La nueva colección está por llegar.
              </p>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                El catálogo se publicará desde el panel con fotos, talles, colores y stock reales.
              </p>
            </div>
          )}
        </div>
      </section>

      {offers.length ? (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-gloria-700">
              Precio anterior visible
            </p>
            <h2 className="mt-2 font-display text-3xl text-gloria-950 sm:text-5xl">
              Ofertas vigentes
            </h2>
          </div>
          <ProductGrid products={offers} />
        </section>
      ) : null}

      <section className="border-y border-gloria-200 bg-white py-14 sm:py-16">
        <div className="container mx-auto grid gap-7 px-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gloria-700">
              Pilchería en Libertador General San Martín
            </p>
            <h2 className="mt-3 font-display text-3xl text-gloria-950 sm:text-5xl">
              Uniformes escolares y ropa en Ledesma, Jujuy
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
              Encontrá indumentaria para mujer y hombre, además de uniformes
              para escuelas primarias y secundarias: remeras, camisas,
              pantalones y medias en todos los talles disponibles.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="rounded-full" asChild>
              <Link href="/guia-de-talles">Ver guía de talles</Link>
            </Button>
            <Button className="rounded-full" asChild>
              <Link href="/uniformes-escolares-ledesma">
                Buscar uniformes
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-gloria-950 py-14 text-white">
        <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[1fr_1.35fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-gloria-200">
              Comprá cerca
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl">
              Del catálogo a tus manos.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {fulfillmentCards.map(([title, text, Icon]) => (
              <div key={String(title)} className="rounded-2xl bg-white/8 p-4">
                <Icon className="size-5 text-gloria-200" />
                <p className="mt-4 font-bold">{title as string}</p>
                <p className="mt-1 text-xs text-white/65">{text as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gloria-100 py-16 sm:py-20">
        <div className="absolute -right-20 top-0 size-72 rounded-full bg-gloria-300/35 blur-3xl" />
        <div className="container relative mx-auto flex flex-col items-start justify-between gap-8 px-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-gloria-700">
              ¿Buscás algo puntual?
            </p>
            <h2 className="mt-3 font-display text-4xl text-gloria-950 sm:text-6xl">
              Te ayudamos a encontrarlo.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Consultanos por talles, colores o disponibilidad en Libertador y localidades cercanas.
            </p>
          </div>
          <Button size="lg" className="min-h-12 rounded-full px-7" asChild>
            {whatsappUrl ? (
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                Escribir por WhatsApp
              </a>
            ) : (
              <Link href="/products">Ver catálogo</Link>
            )}
          </Button>
        </div>
      </section>
    </main>
  );
}
