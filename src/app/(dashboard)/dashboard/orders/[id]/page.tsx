import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { formatVariantLabel } from "@/lib/variants";
import {
  getDeliveryMethodLabel,
  getOrderStatusLabel,
} from "@/lib/commerce";
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
  const customerPhone = shippingAddress?.phone?.replace(/\D/g, "") || "";
  const orderCode = order.id.slice(0, 8).toUpperCase();
  const customerName = shippingAddress?.name?.trim().split(/\s+/)[0] || "";
  const notificationMessage =
    order.shipping_method === "local_delivery"
      ? order.status === "shipped"
        ? `Hola ${customerName}, tu pedido ${orderCode} de Pilchería Gloria ya está en camino.`
        : `Hola ${customerName}, recibimos tu pedido ${orderCode} de Pilchería Gloria. Te avisaremos cuando salga para entrega.`
      : order.status === "ready_for_pickup"
        ? `Hola ${customerName}, tu pedido ${orderCode} de Pilchería Gloria ya está listo para retirar. ${shippingAddress?.references || "Mostrá el código del pedido al retirarlo."}`
        : `Hola ${customerName}, recibimos tu pedido ${orderCode} de Pilchería Gloria. Te avisaremos cuando esté listo para retirar.`;
  const whatsappHref = customerPhone
    ? `https://wa.me/${customerPhone}?text=${encodeURIComponent(notificationMessage)}`
    : null;

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
              <strong>Estado:</strong>{" "}
              {getOrderStatusLabel(order.status, order.shipping_method)}
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
              <strong>Envío:</strong> {formatPrice(Number(order.shipping_cost || 0))}
            </p>
            <p>
              <strong>Método:</strong>{" "}
              {getDeliveryMethodLabel(order.shipping_method)}
            </p>
            <p>
              <strong>Mercado Pago:</strong> {order.mercadopago_status || "Pendiente"}
            </p>
            {order.reservation_expires_at && order.status === "pending" ? (
              <p>
                <strong>Reserva hasta:</strong>{" "}
                {new Date(order.reservation_expires_at).toLocaleString("es-AR")}
              </p>
            ) : null}
            {order.cancel_reason ? (
              <p>
                <strong>Motivo de cancelación:</strong> {order.cancel_reason}
              </p>
            ) : null}
            <div className="pt-3">
              <OrderStatusForm
                orderId={order.id}
                currentStatus={order.status}
                shippingMethod={order.shipping_method}
              />
            </div>
            {whatsappHref ? (
              <Button asChild variant="outline" className="mt-2">
                <Link href={whatsappHref} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 size-4" />
                  Avisar por WhatsApp
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {order.shipping_method === "local_delivery"
                ? "Dirección de entrega"
                : "Datos para el retiro"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{shippingAddress?.name || "Sin nombre"}</p>
            <p>{shippingAddress?.email || "Sin email"}</p>
            <p>{shippingAddress?.phone || "Sin telefono"}</p>
            {order.shipping_method === "local_delivery" ? (
              <>
                <p>{shippingAddress?.street || "Sin calle"}</p>
                <p>
                  {[shippingAddress?.city, shippingAddress?.state, shippingAddress?.zip]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </>
            ) : null}
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
                      {formatVariantLabel(item.variant)}
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
