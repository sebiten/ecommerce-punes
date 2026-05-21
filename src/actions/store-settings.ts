"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actions/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { StoreSettings } from "@/types";

const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(2),
  contactEmail: z.string().trim().email(),
  contactPhone: z.string().trim().min(6),
  whatsappPhone: z.string().trim().optional(),
  addressLine: z.string().trim().min(4),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  businessHours: z.string().trim().min(4),
  instagramUrl: z.union([z.literal(""), z.string().trim().url()]).optional(),
  facebookUrl: z.union([z.literal(""), z.string().trim().url()]).optional(),
  footerText: z.string().trim().min(10),
  standardShippingCost: z.number().nonnegative(),
  expressShippingCost: z.number().nonnegative(),
  freeShippingThreshold: z.number().nonnegative(),
});

const defaultStoreSettings: StoreSettings = {
  store_name: "Pune Colchones",
  contact_email: "info@pune.com.ar",
  contact_phone: "+54 11 1234-5678",
  whatsapp_phone: null,
  address_line: "Av. Industrial 1234",
  city: "Buenos Aires",
  state: "Argentina",
  business_hours: "Lunes a Viernes: 9:00 - 18:00 | Sabados: 9:00 - 13:00",
  instagram_url: null,
  facebook_url: null,
  footer_text:
    "Mas de 30 anos fabricando colchones y sommiers con los mejores materiales. El descanso que tu familia merece.",
  standard_shipping_cost: 5000,
  express_shipping_cost: 10000,
  free_shipping_threshold: 50000,
};

function mapStoreSettings(row: any): StoreSettings {
  return {
    store_name: row.store_name ?? defaultStoreSettings.store_name,
    contact_email: row.contact_email ?? defaultStoreSettings.contact_email,
    contact_phone: row.contact_phone ?? defaultStoreSettings.contact_phone,
    whatsapp_phone: row.whatsapp_phone ?? null,
    address_line: row.address_line ?? defaultStoreSettings.address_line,
    city: row.city ?? defaultStoreSettings.city,
    state: row.state ?? defaultStoreSettings.state,
    business_hours: row.business_hours ?? defaultStoreSettings.business_hours,
    instagram_url: row.instagram_url ?? null,
    facebook_url: row.facebook_url ?? null,
    footer_text: row.footer_text ?? defaultStoreSettings.footer_text,
    standard_shipping_cost:
      Number(row.standard_shipping_cost) || defaultStoreSettings.standard_shipping_cost,
    express_shipping_cost:
      Number(row.express_shipping_cost) || defaultStoreSettings.express_shipping_cost,
    free_shipping_threshold:
      Number(row.free_shipping_threshold) || defaultStoreSettings.free_shipping_threshold,
  };
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching store settings:", error);
    return defaultStoreSettings;
  }

  return data ? mapStoreSettings(data) : defaultStoreSettings;
}

export async function updateStoreSettings(input: z.infer<typeof storeSettingsSchema>) {
  await requireAdmin();
  const payload = storeSettingsSchema.parse(input);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("store_settings").upsert(
    {
      id: 1,
      store_name: payload.storeName,
      contact_email: payload.contactEmail,
      contact_phone: payload.contactPhone,
      whatsapp_phone: payload.whatsappPhone || null,
      address_line: payload.addressLine,
      city: payload.city,
      state: payload.state,
      business_hours: payload.businessHours,
      instagram_url: payload.instagramUrl || null,
      facebook_url: payload.facebookUrl || null,
      footer_text: payload.footerText,
      standard_shipping_cost: payload.standardShippingCost,
      express_shipping_cost: payload.expressShippingCost,
      free_shipping_threshold: payload.freeShippingThreshold,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/checkout");
  revalidatePath("/dashboard/settings");
}
