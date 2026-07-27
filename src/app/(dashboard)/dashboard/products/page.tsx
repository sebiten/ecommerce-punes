import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils";
import { DeleteProductButton } from "./delete-product-button";
import { CopyProductLinkButton } from "./copy-product-link-button";

export default async function ProductsPage() {
  const supabase = getSupabaseAdmin();

  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(name, slug),
      images:product_images(url)
    `)
    .order("created_at", { ascending: false });

  const visibleProducts = (products || []).filter(
    (product) =>
      !["colchones", "sommiers", "almohadas", "accesorios"].includes(
        product.category?.slug || ""
      )
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-muted-foreground">
            {visibleProducts.length} productos en el catálogo
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="h-12 px-4 text-left align-middle font-medium">Producto</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Marca</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Categoría</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Precio</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Estado</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr key={product.id} className="border-b">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={
                            product.images?.[0]?.url ||
                            "https://images.unsplash.com/photo-1766934587214-86e21b3ae093?auto=format&fit=crop&w=120&q=75"
                          }
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{product.brand || "Sin marca"}</td>
                  <td className="p-4">
                    {product.category?.name || "Sin categoría"}
                  </td>
                  <td className="p-4">
                    {formatPrice(Number(product.base_price))}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {product.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/products/${product.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <CopyProductLinkButton
                        slug={product.slug}
                        productName={product.name}
                      />
                      <DeleteProductButton
                        productId={product.id}
                        productName={product.name}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {!visibleProducts.length && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No hay productos. Empezá creando uno nuevo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
