import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { OrderStatusForm } from "./order-status-form";

interface DashboardOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardOrderDetailPage({
  params,
}: DashboardOrderDetailPageProps) {
  const { id } = await params;

  let order = null;
  try {
    order = await getOrderById(id);
  } catch {
    order = null;
  }

  if (!order) {
    notFound();
  }

  const shippingAddress = order.shipping_address as Record<string, string> | null;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Pedido {order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-muted-foreground">
            Creado el {new Date(order.created_at).toLocaleDateString("es-AR")}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/orders">Volver</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Estado:</strong> <span className="capitalize">{order.status}</span>
            </p>
            <p>
              <strong>Total:</strong> {formatPrice(Number(order.total))}
            </p>
            {Number(order.discount_total || 0) > 0 ? (
              <p>
                <strong>Descuento:</strong>{" "}
                {formatPrice(Number(order.discount_total))}
                {order.coupon_code ? ` (${order.coupon_code})` : ""}
              </p>
            ) : null}
            <p>
              <strong>Envio:</strong> {formatPrice(Number(order.shipping_cost || 0))}
            </p>
            <p>
              <strong>Metodo:</strong> {order.shipping_method || "No informado"}
            </p>
            <p>
              <strong>Mercado Pago:</strong> {order.mercadopago_status || "Pendiente"}
            </p>
            <div className="pt-3">
              <OrderStatusForm orderId={order.id} currentStatus={order.status} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Direccion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{shippingAddress?.name || "Sin nombre"}</p>
            <p>{shippingAddress?.email || "Sin email"}</p>
            <p>{shippingAddress?.phone || "Sin telefono"}</p>
            <p>{shippingAddress?.street || "Sin calle"}</p>
            <p>
              {[shippingAddress?.city, shippingAddress?.state, shippingAddress?.zip]
                .filter(Boolean)
                .join(", ")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-12 px-4 text-left font-medium">Producto</th>
                  <th className="h-12 px-4 text-left font-medium">Variante</th>
                  <th className="h-12 px-4 text-left font-medium">Cantidad</th>
                  <th className="h-12 px-4 text-left font-medium">Unitario</th>
                  <th className="h-12 px-4 text-left font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item: any) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-4">{item.product?.name || "Producto eliminado"}</td>
                    <td className="p-4">
                      {item.variant
                        ? `${item.variant.width} x ${item.variant.length} cm`
                        : "-"}
                    </td>
                    <td className="p-4">{item.quantity}</td>
                    <td className="p-4">{formatPrice(Number(item.unit_price))}</td>
                    <td className="p-4">
                      {formatPrice(Number(item.unit_price) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
