import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck, Shield, CreditCard, Headphones, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getProducts, getCategories } from "@/actions/products";

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1920&h=1080&fit=crop",
  colchon: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=500&fit=crop",
  sommier: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=500&fit=crop",
  almohada: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&h=500&fit=crop",
};

const MOCK_CATEGORIES = [
  { id: "1", name: "Colchones", slug: "colchones", description: "Colchones de alta calidad para tu descanso", image_url: null, parent_id: null, sort_order: 1, created_at: "" },
  { id: "2", name: "Sommiers", slug: "sommiers", description: "Sommiers con base de resortes", image_url: null, parent_id: null, sort_order: 2, created_at: "" },
  { id: "3", name: "Accesorios", slug: "accesorios", description: "Almohadas, protectoras y más", image_url: null, parent_id: null, sort_order: 3, created_at: "" },
];

const CATEGORY_IMAGES: Record<string, string> = {
  colchones: IMAGES.colchon,
  sommiers: IMAGES.sommier,
  accesorios: IMAGES.almohada,
};

export default async function HomePage() {
  const featuredProducts = await getProducts({ featured: true, limit: 8 });
  const categories = await getCategories();

  const displayCategories = categories.length > 0 ? categories : MOCK_CATEGORIES;

  return (
    <div className="flex flex-col">
      <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center">
        <Image
          src={IMAGES.hero}
          alt="Pune - Colchones y Sommiers"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
        <div className="container relative mx-auto px-4 py-16">
          <div className="max-w-2xl">
            <span className="inline-block bg-[#f6ae66] text-black text-sm font-semibold px-4 py-1 rounded-full mb-6">
              Directo de fábrica
            </span>
            <h1 className="mb-6 text-5xl lg:text-6xl font-bold text-white leading-tight">
              El descanso que tu familia merece
            </h1>
            <p className="mb-8 text-xl text-white/90 leading-relaxed">
              Más de 30 años fabricando colchones y sommiers con los mejores materiales.
              Garantía de 10 años y envío gratis en Argentina.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-[#f6ae66] text-black hover:bg-[#e5993d] font-semibold"
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
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/products?category=sommiers">Ver sommiers</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#f8f4f0]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Nuestras categorías</h2>
            <p className="text-muted-foreground">Encontrá el producto perfecto para tu descanso</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayCategories.map((category) => (
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
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                  <p className="text-white/80 text-sm mb-4">
                    {category.description || "Ver colección"}
                  </p>
                  <span className="inline-flex items-center text-[#f6ae66] font-semibold text-sm">
                    Ver productos
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold">Productos destacados</h2>
                <p className="text-muted-foreground mt-2">Los más elegidos por nuestros clientes</p>
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
      )}

      <section className="py-20 bg-[#1a1a1a] text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">¿Por qué elegir Pune?</h2>
            <p className="text-white/70">Más de 30 años cuidando el descanso de las familias argentinas</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6ae66]/20">
                <Truck className="h-8 w-8 text-[#f6ae66]" />
              </div>
              <h3 className="mb-3 font-semibold text-lg">Envío gratis</h3>
              <p className="text-sm text-white/60">
                En pedidos superiores a $50.000 a todo el país
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6ae66]/20">
                <Shield className="h-8 w-8 text-[#f6ae66]" />
              </div>
              <h3 className="mb-3 font-semibold text-lg">Garantía 10 años</h3>
              <p className="text-sm text-white/60">
                Todos nuestros productos tienen garantía extendida
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6ae66]/20">
                <CreditCard className="h-8 w-8 text-[#f6ae66]" />
              </div>
              <h3 className="mb-3 font-semibold text-lg">Hasta 12 cuotas</h3>
              <p className="text-sm text-white/60">
                Pagá en hasta 12 cuotas sin interés con tarjeta
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6ae66]/20">
                <Headphones className="h-8 w-8 text-[#f6ae66]" />
              </div>
              <h3 className="mb-3 font-semibold text-lg">Atención 24/7</h3>
              <p className="text-sm text-white/60">
                Nuestro equipo está para ayudarte siempre
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#f6ae66]">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-black text-black" />
            ))}
          </div>
          <p className="text-xl font-semibold text-black mb-2">
            Calificados por más de 2,000 clientes satisfechos
          </p>
          <p className="text-black/70">
            Descubrí por qué Pune es la elección de miles de familias
          </p>
        </div>
      </section>
    </div>
  );
}