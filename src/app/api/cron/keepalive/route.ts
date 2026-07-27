import { NextResponse } from "next/server";
import { hasCronSecret, isCronAuthorized } from "@/lib/cron/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function keepSupabaseActive(request: Request) {
  if (!hasCronSecret()) {
    return NextResponse.json(
      { error: "CRON_SECRET no está configurado" },
      { status: 503 }
    );
  }

  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_settings")
      .select("id")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      database: "reachable",
      settingsFound: Boolean(data),
      durationMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Falló el keepalive de Supabase:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Supabase no está disponible",
        checkedAt: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

export async function GET(request: Request) {
  return keepSupabaseActive(request);
}

export async function POST(request: Request) {
  return keepSupabaseActive(request);
}
