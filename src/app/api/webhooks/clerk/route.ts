import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === "user.created") {
      const supabase = await createClient();

      const { error } = await supabase.from("profiles").upsert({
        id: data.id,
        email: data.email_addresses?.[0]?.email_address || "",
        full_name: data.first_name && data.last_name 
          ? `${data.first_name} ${data.last_name}` 
          : data.first_name || data.last_name || "",
        role: "client",
      });

      if (error) {
        console.error("Error creating profile:", error);
        return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}