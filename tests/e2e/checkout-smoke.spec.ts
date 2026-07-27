import { expect, test } from "@playwright/test";
import {
  cleanupCheckoutSmokeProduct,
  seedCheckoutSmokeProduct,
} from "./helpers/supabase";

test("guest user can go from product to checkout", async ({ page }) => {
  const seed = await seedCheckoutSmokeProduct();

  try {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    await page.route("**/api/checkout", async (route) => {
      const request = route.request();
      const payload = request.postDataJSON() as {
        items?: Array<{ product_id: string; variant_id: string | null; quantity: number }>;
        shippingAddress?: { email?: string; street?: string | null };
      };

      expect(payload.items).toEqual([
        expect.objectContaining({
          product_id: seed.productId,
          variant_id: seed.variantId,
          quantity: 1,
        }),
      ]);
      expect(payload.shippingAddress?.email).toBe("qa+gloria@example.com");
      expect(payload.shippingAddress?.street).toBeNull();

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          preference: {
            init_point: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=e2e",
          },
        }),
      });
    });

    await page.goto("/products");
    await expect(page.locator(`a[href="/products/${seed.productSlug}"]`)).toBeVisible();
    await page.goto(`/products/${seed.productSlug}`);
    await expect(page).toHaveURL(new RegExp(`/products/${seed.productSlug}$`));

    await expect(page.getByText("Negro", { exact: true }).first()).toBeVisible();
    await page.getByTestId("add-to-cart-button").click();

    const cartDrawer = page.getByTestId("cart-drawer");
    await expect(cartDrawer).toBeVisible();
    await expect(cartDrawer).toContainText(seed.productName);

    await page.getByTestId("cart-checkout-link").click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(cartDrawer).not.toBeInViewport();

    await page.getByLabel("Nombre").fill("QA");
    await page.getByLabel("Apellido").fill("Gloria");
    await page.getByLabel("Email").fill("qa+gloria@example.com");
    await page.getByLabel("Teléfono").fill("3884000000");
    await page.getByTestId("checkout-submit").click();
    await expect(page).toHaveURL(/mercadopago\.com\.ar\/checkout/);
  } finally {
    await cleanupCheckoutSmokeProduct(seed);
  }
});
