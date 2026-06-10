import { expect, test } from "@playwright/test";
import { createHmac } from "node:crypto";
import {
  cleanupCheckoutSmokeProduct,
  getLatestOrderForProduct,
  getVariantStock,
  seedCheckoutSmokeProduct,
} from "./helpers/supabase";

function createMercadoPagoSignature({
  dataId,
  requestId,
  timestamp,
}: {
  dataId: string;
  requestId: string;
  timestamp: string;
}) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Falta MERCADOPAGO_WEBHOOK_SECRET");
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const signature = createHmac("sha256", secret).update(manifest).digest("hex");

  return `ts=${timestamp},v1=${signature}`;
}

test("approved MercadoPago webhook marks guest order as paid", async ({ page }) => {
  const seed = await seedCheckoutSmokeProduct();

  try {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    await page.goto(`/products/${seed.productSlug}`);
    await page.getByTestId("add-to-cart-button").click();
    await page.getByTestId("cart-checkout-link").click();

    await page.getByLabel("Nombre").fill("QA");
    await page.getByLabel("Apellido").fill("Punes");
    await page.getByLabel("Email").fill("qa+punes@example.com");
    await page.getByLabel("Telefono").fill("1133334444");
    await page.getByLabel("Calle y numero").fill("Av. Test 123");
    await page.getByLabel("Ciudad").fill("Buenos Aires");
    await page.getByLabel("Provincia").fill("Buenos Aires");
    await page.getByLabel("Codigo postal").fill("1000");

    const checkoutResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/checkout") &&
        response.request().method() === "POST"
    );

    await page.getByTestId("checkout-submit").click();
    const checkoutResponse = await checkoutResponsePromise;
    expect(checkoutResponse.ok()).toBe(true);

    const pendingOrder = await getLatestOrderForProduct(seed.productId);
    expect(pendingOrder).toMatchObject({
      status: "pending",
      mercadopago_id: null,
      mercadopago_status: null,
    });
    expect(pendingOrder.items).toEqual([
      expect.objectContaining({
        product_id: seed.productId,
        variant_id: seed.variantId,
        quantity: 1,
      }),
    ]);
    await expect.poll(async () => getVariantStock(seed.variantId)).toBe(4);

    const requestId = `e2e-request-${Date.now()}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const response = await page.request.post("/api/webhooks/mercadopago", {
      headers: {
        "x-request-id": requestId,
        "x-signature": createMercadoPagoSignature({
          dataId: pendingOrder.id,
          requestId,
          timestamp,
        }),
      },
      data: {
        type: "payment",
        data: { id: pendingOrder.id },
      },
    });

    expect(response.ok()).toBe(true);

    await expect
      .poll(async () => getLatestOrderForProduct(seed.productId), {
        timeout: 10_000,
      })
      .toMatchObject({
        id: pendingOrder.id,
        status: "paid",
        mercadopago_id: pendingOrder.id,
        mercadopago_status: "approved",
        stock_restored: false,
      });
    await expect.poll(async () => getVariantStock(seed.variantId)).toBe(4);
  } finally {
    await cleanupCheckoutSmokeProduct(seed);
  }
});
