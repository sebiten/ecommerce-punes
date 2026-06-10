import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidateProductCacheFromRouteHandler } from "@/lib/cache/products";

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

async function restoreOrderStock(orderId: string) {
  const supabase = getSupabaseAdmin();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(`
      id,
      stock_restored,
      items:order_items(variant_id, quantity)
    `)
    .eq("id", orderId)
    .single();

  if (orderError || !order || order.stock_restored) {
    if (orderError) {
      console.error("Error leyendo orden para restaurar stock:", orderError);
    }
    return;
  }

  let stockChanged = false;

  for (const item of order.items || []) {
    if (!item.variant_id) {
      continue;
    }

    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .select("stock")
      .eq("id", item.variant_id)
      .single();

    if (variantError) {
      throw variantError;
    }

    const { error: updateError } = await supabase
      .from("product_variants")
      .update({ stock: Number(variant.stock ?? 0) + Number(item.quantity) })
      .eq("id", item.variant_id);

    if (updateError) {
      throw updateError;
    }

    stockChanged = true;
  }

  await supabase
    .from("orders")
    .update({ stock_restored: true })
    .eq("id", orderId);

  if (stockChanged) {
    revalidateProductCacheFromRouteHandler();
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => null);
    const type = url.searchParams.get("type") || body?.type;
    const paymentId = String(
      url.searchParams.get("data.id") || body?.data?.id || body?.id || ""
    );

    const supabase = getSupabaseAdmin();

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
          : await fetch(
              `https://api.mercadopago.com/v1/payments/${paymentId}`,
              {
                headers: {
                  Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
                },
              }
            ).then(async (paymentResponse) => {
              if (!paymentResponse.ok) {
                const errorBody = await paymentResponse.text();
                throw new Error(`MercadoPago payment fetch failed: ${errorBody}`);
              }

              return paymentResponse.json();
            });
      const externalReference = payment.external_reference;
      const status = payment.status;
      const failedStatuses = new Set([
        "rejected",
        "cancelled",
        "refunded",
        "charged_back",
      ]);
      const orderStatus = status === "approved"
        ? "paid"
        : failedStatuses.has(status)
          ? "cancelled"
          : "pending";

      if (externalReference) {
        if (orderStatus === "cancelled") {
          await restoreOrderStock(externalReference);
        }

        const { error } = await supabase
          .from("orders")
          .update({
            mercadopago_id: paymentId,
            mercadopago_status: status,
            status: orderStatus,
          })
          .eq("id", externalReference);

        if (error) {
          console.error("Error updating order:", error);
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
