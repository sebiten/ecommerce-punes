import { MercadoPagoConfig } from "mercadopago";

function getMercadoPagoAccessToken() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN");
  }

  return accessToken;
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "missing-access-token",
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
  const accessToken = getMercadoPagoAccessToken();
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preference),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Error creating MercadoPago preference: ${errorBody}`);
  }

  return response.json();
}

export async function getPreference(preferenceId: string) {
  const accessToken = getMercadoPagoAccessToken();
  const response = await fetch(`https://api.mercadopago.com/checkout/preferences/${preferenceId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error fetching MercadoPago preference");
  }

  return response.json();
}

export { client as mercadopagoClient };
