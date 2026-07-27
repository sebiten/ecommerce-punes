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
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
  payment_methods?: {
    excluded_payment_types?: Array<{ id: string }>;
    installments?: number;
  };
}

export async function createPreference(preference: MPPreference) {
  if (process.env.E2E_MERCADOPAGO_FAKE === "1") {
    return {
      id: `e2e-${preference.external_reference ?? Date.now()}`,
      init_point: preference.back_urls?.success,
      sandbox_init_point: preference.back_urls?.success,
    };
  }

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

export async function searchPaymentsByExternalReference(externalReference: string) {
  if (process.env.E2E_MERCADOPAGO_FAKE === "1") {
    return { results: [] };
  }

  const accessToken = getMercadoPagoAccessToken();
  const url = new URL("https://api.mercadopago.com/v1/payments/search");
  url.searchParams.set("external_reference", externalReference);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Error searching MercadoPago payments: ${errorBody}`);
  }

  return response.json();
}

export async function getPayment(paymentId: string) {
  const accessToken = getMercadoPagoAccessToken();
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Error fetching MercadoPago payment: ${errorBody}`);
  }

  return response.json();
}

export { client as mercadopagoClient };
