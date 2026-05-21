import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Truck,
  Shield,
  CreditCard,
  Headphones,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getProducts, getCategories } from "@/actions/products";

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1920&h=1080&fit=crop",
  colchon: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=500&fit=crop",
  sommier: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=500&fit=crop",
  almohada: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&h=500&fit=crop",
};

const CATEGORY_IMAGES: Record<string, string> = {
  colchones: IMAGES.colchon,
  sommiers: IMAGES.sommier,
  accesorios: IMAGES.almohada,
};

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getProducts({ featured: true, limit: 8 }),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col">
      <section className="relative flex min-h-[600px] items-center lg:min-h-[700px]">
        <Image
          src={IMAGES.hero}
          alt="Pune - Colchones y Sommiers"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
        <div className="container relative mx-auto px-4 py-16">
          <div className="max-w-2xl">
            <span className="mb-6 inline-block rounded-full bg-[#f6ae66] px-4 py-1 text-sm font-semibold text-black">
              Directo de fabrica
            </span>
            <h1 className="mb-6 text-5xl font-bold leading-tight text-white lg:text-6xl">
              El descanso que tu familia merece
            </h1>
            <p className="mb-8 text-xl leading-relaxed text-white/90">
              Mas de 30 anos fabricando colchones y sommiers con los mejores
              materiales. Garantia de 10 anos y envio gratis en Argentina.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-[#f6ae66] font-semibold text-black hover:bg-[#e5993d]"
                asChild
              >
                <Link href="/products">
                  Ver productos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-black "
                asChild
              >
                <Link href="/products?category=sommiers ">Ver sommiers</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f4f0] py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Nuestras categorias</h2>
            <p className="text-muted-foreground">
              Encontra el producto perfecto para tu descanso
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group relative h-80 overflow-hidden rounded-2xl shadow-lg"
              >
                <Image
                  src={CATEGORY_IMAGES[category.slug] || IMAGES.colchon}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="mb-2 text-2xl font-bold text-white">
                    {category.name}
                  </h3>
                  <p className="mb-4 text-sm text-white/80">
                    {category.description || "Ver coleccion"}
                  </p>
                  <span className="inline-flex items-center text-sm font-semibold text-[#f6ae66]">
                    Ver productos
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {categories.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              No hay categorias publicadas todavia.
            </p>
          ) : null}
        </div>
      </section>

      {featuredProducts.length > 0 ? (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Productos destacados</h2>
                <p className="mt-2 text-muted-foreground">
                  Los mas elegidos por nuestros clientes
                </p>
              </div>
              <Button variant="link" className="text-[#f6ae66]" asChild>
                <Link href="/products">
                  Ver todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ProductGrid products={featuredProducts} />
          </div>
        </section>
      ) : null}

      <section className="bg-[#1a1a1a] py-20 text-white">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">Por que elegir Pune?</h2>
            <p className="text-white/70">
              Mas de 30 anos cuidando el descanso de las familias argentinas
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6ae66]/20">
                <Truck className="h-8 w-8 text-[#f6ae66]" />
              </div>
              <h3 className="mb-3 text-lg font-semibold">Envio gratis</h3>
              <p className="text-sm text-white/60">
                En pedidos superiores a $50.000 a todo el pais
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6ae66]/20">
                <Shield className="h-8 w-8 text-[#f6ae66]" />
              </div>
              <h3 className="mb-3 text-lg font-semibold">Garantia 10 anos</h3>
              <p className="text-sm text-white/60">
                Todos nuestros productos tienen garantia extendida
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6ae66]/20">
                <CreditCard className="h-8 w-8 text-[#f6ae66]" />
              </div>
              <h3 className="mb-3 text-lg font-semibold">Hasta 12 cuotas</h3>
              <p className="text-sm text-white/60">
                Paga en hasta 12 cuotas sin interes con tarjeta
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6ae66]/20">
                <Headphones className="h-8 w-8 text-[#f6ae66]" />
              </div>
              <h3 className="mb-3 text-lg font-semibold">Atencion 24/7</h3>
              <p className="text-sm text-white/60">
                Nuestro equipo esta para ayudarte siempre
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f6ae66] py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-black text-black" />
            ))}
          </div>
          <p className="mb-2 text-xl font-semibold text-black">
            Calificados por mas de 2,000 clientes satisfechos
          </p>
          <p className="text-black/70">
            Descubri por que Pune es la eleccion de miles de familias
          </p>
        </div>
      </section>
    </div>
  );
}
