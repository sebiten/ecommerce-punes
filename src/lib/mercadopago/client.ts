import { MercadoPagoConfig } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export interface MPPreferenceItem {
  id: string;
  title: string;
  unit_price: number;
  quantity: number;
  picture_url?: string;
  description?: string;
}

export interface MPPreference {
  items: MPPreferenceItem[];
  payer?: {
    name: string;
    surname: string;
    email: string;
  };
  shipments?: {
    mode: string;
    default_shipping_method?: number;
    zip_code?: string;
  };
  external_reference?: string;
  notification_url?: string;
  back_urls?: {
    success: string;
    failure: string;
    pending: string;
  };
}

export async function createPreference(preference: MPPreference) {
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preference),
  });

  if (!response.ok) {
    throw new Error("Error creating MercadoPago preference");
  }

  return response.json();
}

export async function getPreference(preferenceId: string) {
  const response = await fetch(`https://api.mercadopago.com/checkout/preferences/${preferenceId}`, {
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error fetching MercadoPago preference");
  }

  return response.json();
}

export { client as mercadopagoClient };