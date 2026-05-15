import { notFound } from "next/navigation";
import Image from "next/image";
import { Star, Truck, Shield, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getProductBySlug } from "@/actions/products";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";
import type { Metadata } from "next";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };

  return {
    title: `${product.name} - Pune`,
    description: product.description || `Comprar ${product.name}`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const imageUrl =
    product.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=800&fit=crop";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
          {product.featured && (
            <Badge className="absolute left-4 top-4">Destacado</Badge>
          )}
        </div>

        <div className="flex flex-col">
          {product.category && (
            <p className="text-sm text-muted-foreground mb-2">
              {product.category.name}
            </p>
          )}
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < 4 ? "fill-primary text-primary" : "text-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">(128 reseñas)</span>
          </div>

          <p className="text-3xl font-bold mb-6">
            {formatPrice(Number(product.basePrice))}
          </p>

          <div className="prose prose-sm mb-6 text-muted-foreground">
            <p>{product.description || "Descripción no disponible."}</p>
          </div>

          {product.variants && product.variants.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Tamaños disponibles</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="rounded-md border p-3 text-center"
                    >
                      <p className="text-sm">
                        {variant.width} x {variant.length} cm
                      </p>
                      {variant.priceOverride && (
                        <p className="text-sm font-semibold">
                          {formatPrice(Number(variant.priceOverride))}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Stock: {variant.stock}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <AddToCartButton product={product} />

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <span>Envío gratis a todo el país en pedidos mayores a $50.000</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span>Garantía de 10 años en todos los productos</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
              <span>30 días de prueba - Si no te gusta, te devolvemos el dinero</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}