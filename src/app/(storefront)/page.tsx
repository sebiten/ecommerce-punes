import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BedDouble,
  CreditCard,
  Factory,
  Headphones,
  Moon,
  Shield,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getCategories, getProducts } from "@/actions/products";

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1400&h=1200&fit=crop",
  colchon: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&h=650&fit=crop",
  sommier: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=700&h=650&fit=crop",
  almohada: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=700&h=650&fit=crop",
};

const CATEGORY_IMAGES: Record<string, string> = {
  colchones: IMAGES.colchon,
  sommiers: IMAGES.sommier,
  accesorios: IMAGES.almohada,
};

const BENEFITS = [
  {
    icon: Truck,
    title: "Envío gratis",
    text: "En pedidos superiores a $50.000 a todo el país.",
  },
  {
    icon: Shield,
    title: "Garantía 10 años",
    text: "Productos pensados para durar, con respaldo real.",
  },
  {
    icon: CreditCard,
    title: "Hasta 12 cuotas",
    text: "Pagá cómodo y recibí asesoramiento antes de elegir.",
  },
  {
    icon: Headphones,
    title: "Atención cercana",
    text: "Te ayudamos a encontrar la firmeza correcta.",
  },
];

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getProducts({ featured: true, limit: 8 }),
    getCategories(),
  ]);

  return (
    <div className="overflow-hidden bg-[#fffaf4]">
      <section className="relative isolate min-h-[760px] overflow-hidden bg-[#21170f] text-[#fff7ea]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(246,174,102,0.24),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(255,247,234,0.12),transparent_30%),linear-gradient(135deg,#21170f_0%,#342216_52%,#140e09_100%)]" />
        <div className="absolute left-1/2 top-0 h-full w-[1px] bg-[#fff7ea]/10" />
        <div className="animate-punes-drift absolute -right-28 top-24 h-80 w-80 rounded-full border border-[#f6ae66]/25" />
        <div className="animate-punes-shimmer absolute bottom-16 left-10 hidden h-56 w-56 rounded-full border border-[#fff7ea]/10 sm:block" />

        <div className="container relative mx-auto grid min-h-[760px] items-center gap-12 px-4 py-16 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="animate-punes-rise max-w-3xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#f6ae66]/35 bg-[#fff7ea]/8 px-4 py-2 text-sm font-semibold text-[#ffd6a5]">
              <Sparkles className="h-4 w-4" />
              Descanso fabricado con oficio
            </p>
            <h1 className="text-balance text-5xl font-black leading-[0.9] tracking-[-0.05em] sm:text-7xl lg:text-8xl">
              Dormir bien también puede verse extraordinario.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#fff7ea]/72">
              Colchones, sommiers y accesorios seleccionados para que la
              habitación se sienta más cálida, más firme y más tuya desde la
              primera noche.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="rounded-full bg-[#f6ae66] px-7 font-bold text-[#17110c] shadow-xl shadow-[#000]/20 hover:bg-[#ffbd79]"
                asChild
              >
                <Link href="/products">
                  Explorar descanso
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-[#fff7ea]/30 bg-[#fff7ea]/8 px-7 text-[#fff7ea] hover:bg-[#fff7ea] hover:text-[#21170f]"
                asChild
              >
                <Link href="/products?category=sommiers">Ver sommiers</Link>
              </Button>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl border border-[#fff7ea]/12 bg-[#fff7ea]/7 p-4">
                <p className="text-2xl font-black text-[#ffd6a5]">30+</p>
                <p className="mt-1 text-[#fff7ea]/62">años de experiencia</p>
              </div>
              <div className="rounded-2xl border border-[#fff7ea]/12 bg-[#fff7ea]/7 p-4">
                <p className="text-2xl font-black text-[#ffd6a5]">10</p>
                <p className="mt-1 text-[#fff7ea]/62">años de garantía</p>
              </div>
              <div className="rounded-2xl border border-[#fff7ea]/12 bg-[#fff7ea]/7 p-4">
                <p className="text-2xl font-black text-[#ffd6a5]">AR</p>
                <p className="mt-1 text-[#fff7ea]/62">envíos al país</p>
              </div>
            </div>
          </div>

          <div className="relative min-h-[560px]">
            <div className="animate-punes-float-slow absolute right-0 top-6 h-[74%] w-[78%] overflow-hidden rounded-[3rem] border border-[#fff7ea]/18 bg-[#fff7ea]/8 shadow-2xl shadow-black/35">
              <Image
                src={IMAGES.hero}
                alt="Dormitorio cálido con cama preparada para descanso premium"
                fill
                className="object-cover"
                preload
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#21170f]/45 via-transparent to-transparent" />
            </div>

            <div className="animate-punes-float absolute left-0 top-20 w-56 rounded-[2rem] border border-[#f6ae66]/30 bg-[#fff7ea] p-5 text-[#21170f] shadow-2xl shadow-black/25">
              <Factory className="mb-5 h-6 w-6 text-[#9a5b19]" />
              <p className="text-sm font-bold">Hecho para uso real</p>
              <p className="mt-2 text-sm leading-6 text-[#6d6257]">
                Capas, soporte y terminación pensadas para noches largas.
              </p>
            </div>

            <div className="absolute bottom-8 left-12 right-12 rounded-[2rem] border border-[#fff7ea]/18 bg-[#140e09]/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-sm">
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-2xl bg-[#fff7ea]/8 p-4">
                  <BedDouble className="mx-auto mb-2 h-5 w-5 text-[#ffd6a5]" />
                  Firmeza
                </div>
                <div className="rounded-2xl bg-[#fff7ea]/8 p-4">
                  <Moon className="mx-auto mb-2 h-5 w-5 text-[#ffd6a5]" />
                  Confort
                </div>
                <div className="rounded-2xl bg-[#fff7ea]/8 p-4">
                  <Shield className="mx-auto mb-2 h-5 w-5 text-[#ffd6a5]" />
                  Respaldo
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-[#f8f4f0] py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9a5b19]">
                Elegí por sensación
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-[#17110c]">
                No todos descansan igual.
              </h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-[#66584a]">
              Organizamos el catálogo por tipo de descanso para que la compra no
              se sienta fría: soporte, estética y uso cotidiano en una sola
              decisión.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group animate-punes-rise relative h-[27rem] overflow-hidden rounded-[2rem] border border-[#eadfce] bg-[#fffdf9] shadow-sm shadow-[#5c3514]/8"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <Image
                  src={CATEGORY_IMAGES[category.slug] || IMAGES.colchon}
                  alt={category.name}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-[1.06]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#17110c]/78 via-[#17110c]/20 to-transparent" />
                <div className="absolute inset-x-5 bottom-5">
                  <p className="mb-3 inline-flex rounded-full bg-[#fff7ea]/92 px-3 py-1 text-xs font-bold text-[#9a5b19]">
                    Colección {index + 1}
                  </p>
                  <h3 className="text-3xl font-black text-[#fff7ea]">
                    {category.name}
                  </h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#fff7ea]/78">
                    {category.description || "Ver colección"}
                  </p>
                  <span className="mt-5 inline-flex items-center rounded-full bg-[#f6ae66] px-4 py-2 text-sm font-bold text-[#17110c]">
                    Ver productos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {categories.length === 0 ? (
            <p className="mt-6 text-center text-sm text-[#66584a]">
              No hay categorías publicadas todavía.
            </p>
          ) : null}
        </div>
      </section>

      {featuredProducts.length > 0 ? (
        <section className="bg-[#fffaf4] py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#9a5b19]">
                  Selección Punes
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-tight text-[#17110c]">
                  Productos destacados
                </h2>
                <p className="mt-3 text-[#66584a]">
                  Los más elegidos por clientes que buscan firmeza, estética y
                  buen descanso.
                </p>
              </div>
              <Button variant="outline" className="rounded-full border-[#9a5b19] text-[#9a5b19]" asChild>
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

      <section className="relative overflow-hidden bg-[#1a110b] py-20 text-[#fff7ea]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(246,174,102,0.18),transparent_34%)]" />
        <div className="container relative mx-auto px-4">
          <div className="mb-14 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#ffd6a5]">
              Compra sin dudas
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight">
              Detalles que hacen más fácil elegir.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="rounded-[1.75rem] border border-[#fff7ea]/12 bg-[#fff7ea]/7 p-6"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6ae66] text-[#17110c]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">{benefit.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#fff7ea]/62">
                    {benefit.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f6ae66] py-16">
        <div className="container mx-auto px-4 text-center text-[#17110c]">
          <div className="mb-4 flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-[#17110c] text-[#17110c]" />
            ))}
          </div>
          <p className="mb-2 text-xl font-black">
            Calificados por más de 2.000 clientes satisfechos
          </p>
          <p className="text-[#17110c]/72">
            Descubrí por qué Punes es la elección de miles de familias.
          </p>
        </div>
      </section>
    </div>
  );
}
