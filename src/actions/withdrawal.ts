"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { sendWithdrawalReceipt } from "@/lib/notifications/email";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const withdrawalSchema = z.object({
  orderReference: z.string().trim().min(4).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6).max(40),
  reason: z.string().trim().max(1000).optional(),
  website: z.string().max(0).optional(),
});

function createRequestCode() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `ARREP-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function createWithdrawalRequest(
  input: z.infer<typeof withdrawalSchema>
) {
  const payload = withdrawalSchema.parse(input);
  const supabase = getSupabaseAdmin();
  const requestCode = createRequestCode();
  const orderId = z.string().uuid().safeParse(payload.orderReference);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: recentRequest } = await supabase
    .from("withdrawal_requests")
    .select("id")
    .eq("email", payload.email)
    .gte("created_at", fiveMinutesAgo)
    .limit(1)
    .maybeSingle();

  if (recentRequest) {
    throw new Error("Ya recibimos una solicitud reciente con este email.");
  }

  const { error } = await supabase.from("withdrawal_requests").insert({
    request_code: requestCode,
    order_id: orderId.success ? orderId.data : null,
    order_reference: payload.orderReference,
    email: payload.email,
    phone: payload.phone,
    reason: payload.reason || null,
  });

  if (error) {
    throw new Error("No se pudo registrar la solicitud. Intentá nuevamente.");
  }

  await sendWithdrawalReceipt({
    requestCode,
    email: payload.email,
    orderReference: payload.orderReference,
  }).catch((notificationError) => {
    console.error("No se pudo enviar el comprobante de arrepentimiento:", notificationError);
  });

  return { requestCode };
}
