import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    const supabase = await createClient();

    if (type === "payment") {
      const paymentId = data.id;

      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          },
        }
      );

      const payment = await paymentResponse.json();
      const externalReference = payment.external_reference;
      const status = payment.status;

      if (externalReference) {
        const { error } = await supabase
          .from("orders")
          .update({
            mercadopago_id: paymentId,
            mercadopago_status: status,
            status: status === "approved" ? "paid" : "pending",
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