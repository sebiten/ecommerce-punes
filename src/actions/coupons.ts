"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actions/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Coupon } from "@/types";

const couponPayloadSchema = z.object({
  code: z.string().trim().min(3),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive(),
  minPurchase: z.number().nonnegative().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

type CouponPayload = z.infer<typeof couponPayloadSchema>;

function normalizeCoupon(row: any): Coupon {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: Number(row.value),
    min_purchase: row.min_purchase === null ? null : Number(row.min_purchase),
    max_uses: row.max_uses,
    used_count: row.used_count || 0,
    expires_at: row.expires_at,
    active: row.active !== false,
    created_at: row.created_at,
  };
}

export async function getCouponsAdmin(): Promise<Coupon[]> {
  await requireAdmin();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(normalizeCoupon);
}

export async function createCoupon(input: CouponPayload) {
  await requireAdmin();
  const payload = couponPayloadSchema.parse(input);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("coupons").insert({
    code: payload.code.trim().toUpperCase(),
    type: payload.type,
    value: payload.value,
    min_purchase: payload.minPurchase ?? null,
    max_uses: payload.maxUses ?? null,
    expires_at: payload.expiresAt || null,
    active: payload.active ?? true,
  });

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard/coupons");
}

export async function deleteCoupon(id: string) {
  await requireAdmin();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("coupons").delete().eq("id", id);

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard/coupons");
}
