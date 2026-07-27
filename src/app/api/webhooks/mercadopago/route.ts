import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateProductCacheFromRouteHandler } from "@/lib/cache/products";
import { getPayment } from "@/lib/mercadopago/client";
import { applyMercadoPagoPayment } from "@/lib/orders/payment-state";
import { sendOrderEmail } from "@/lib/notifications/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function parseSignatureHeader(signatureHeader: string | null) {
  if (!signatureHeader) {
    return null;
  }

  return Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    })
  ) as { ts?: string; v1?: string };
}

function isValidWebhookSignature({
  dataId,
  requestId,
  signatureHeader,
}: {
  dataId: string;
  requestId: string | null;
  signatureHeader: string | null;
}) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("Falta MERCADOPAGO_WEBHOOK_SECRET; se validara contra la API de MercadoPago");
    return false;
  }

  const signature = parseSignatureHeader(signatureHeader);
  if (!signature?.ts || !signature.v1 || !requestId) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${signature.ts};`;
  const expectedSignature = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = Buffer.from(signature.v1, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => null);
    const type = url.searchParams.get("type") || body?.type;
    const paymentId = String(
      url.searchParams.get("data.id") || body?.data?.id || body?.id || ""
    );

    if (type === "payment" && paymentId) {
      const isValidSignature = isValidWebhookSignature({
        dataId: paymentId,
        requestId: request.headers.get("x-request-id"),
        signatureHeader: request.headers.get("x-signature"),
      });

      if (!isValidSignature) {
        console.warn("Webhook MercadoPago sin firma valida; se valida el pago con la API", {
          paymentId,
          hasRequestId: Boolean(request.headers.get("x-request-id")),
          hasSignature: Boolean(request.headers.get("x-signature")),
        });
      }

      const payment =
        process.env.E2E_MERCADOPAGO_FAKE === "1"
          ? {
              id: paymentId,
              status: "approved",
              external_reference: paymentId,
            }
          : await getPayment(paymentId);
      const externalReference = payment.external_reference;

      if (externalReference) {
        const nextStatus = await applyMercadoPagoPayment(
          externalReference,
          payment
        );
        const emailEvent =
          nextStatus === "paid"
            ? "payment-approved"
            : nextStatus === "payment_review"
              ? "payment-review"
              : nextStatus === "cancelled"
                ? "cancelled"
                : null;
        if (emailEvent) {
          await sendOrderEmail(externalReference, emailEvent).catch(
            (notificationError) => {
              console.error(
                "No se pudo enviar la notificación del webhook:",
                notificationError
              );
            }
          );
        }

        if (["paid", "payment_review", "cancelled"].includes(nextStatus)) {
          revalidateProductCacheFromRouteHandler();
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
