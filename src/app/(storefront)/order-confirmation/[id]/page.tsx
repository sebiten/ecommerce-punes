import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getOrderById } from "@/actions/orders";
import { ClearCartOnMount } from "./clear-cart-on-mount";

interface OrderConfirmationPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({
  params,
}: OrderConfirmationPageProps) {
  const { id } = await params;
  let order;

  try {
    order = await getOrderById(id);
  } catch {
    order = null;
  }

  return (
    <div className="container mx-auto px-4 py-16 text-center max-w-xl">
      <ClearCartOnMount />
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>

      <h1 className="mb-4 text-2xl font-bold">
        {order ? "¡Gracias por tu compra!" : "Pedido recibido"}
      </h1>

      {order ? (
        <div className="mb-8 text-left rounded-lg border p-6 text-left">
          <p className="mb-2">
            <strong>Número de pedido:</strong> {order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="mb-2">
            <strong>Total:</strong> {formatPrice(Number(order.total))}
          </p>
          <p className="mb-4">
            <strong>Estado:</strong>{" "}
            <span className="capitalize">{order.status}</span>
          </p>

          <p className="text-muted-foreground">
            Te enviamos un email con los detalles de tu pedido. En cuanto se
            confirme el pago, comenzaremos a preparar tu envío.
          </p>
        </div>
      ) : (
        <p className="mb-8 text-muted-foreground">
          Tu pedido está siendo procesado. Te notificaremos cuando esté listo.
        </p>
      )}

      <div className="flex flex-col gap-4">
        <Button asChild>
          <Link href="/products">Seguir comprando</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/account/orders">Ver mis pedidos</Link>
        </Button>
      </div>
    </div>
  );
}
