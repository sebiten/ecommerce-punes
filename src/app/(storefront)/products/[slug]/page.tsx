import { notFound } from "next/navigation";
import { Truck, Shield, RotateCcw } from "lucide-react";
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ProductGallery
          productName={product.name}
          featured={product.featured}
          images={product.images}
        />

        <div className="flex flex-col">
          {product.category ? (
            <p className="mb-2 text-sm text-muted-foreground">
              {product.category.name}
            </p>
          ) : null}
          <h1 className="mb-4 text-3xl font-bold">{product.name}</h1>

          <ProductReviewSummary productId={product.id} />

          <p className="mb-6 text-3xl font-bold">
            {formatPrice(Number(product.basePrice))}
          </p>

          <div className="prose prose-sm mb-6 text-muted-foreground">
            <p>{product.description || "Descripcion no disponible."}</p>
          </div>

          <AddToCartButton product={product} />

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <span>Envio gratis a todo el pais en pedidos mayores a $50.000</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span>Garantia de 10 anos en todos los productos</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
              <span>30 dias de prueba - Si no te gusta, te devolvemos el dinero</span>
            </div>
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} productSlug={product.slug} />
    </div>
  );
}
