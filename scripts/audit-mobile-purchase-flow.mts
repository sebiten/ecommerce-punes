import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { chromium, devices, type Page } from "@playwright/test";

const baseUrl = process.argv[2] || "http://localhost:3000";

async function auditPage(page: Page) {
  return page.evaluate(() => {
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== "hidden" &&
        style.display !== "none"
      );
    };

    const controls = Array.from(
      document.querySelectorAll("button, a, input, select, textarea, [role='radio']")
    )
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          text:
            element.getAttribute("aria-label") ||
            element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ||
            element.getAttribute("name") ||
            "",
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });

    return {
      title: document.title,
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
      controlCount: controls.length,
      controlsUnder44px: controls.filter(
        (control) => control.width < 44 || control.height < 44
      ),
      bodyText: document.body.innerText.replace(/\n{3,}/g, "\n\n").slice(0, 5000),
    };
  });
}

const browser = await chromium.launch();
const context = await browser.newContext({
  ...devices["Pixel 5"],
  locale: "es-AR",
});
const page = await context.newPage();
const consoleErrors: string[] = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
await page.route("**/api/checkout", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      preference: { init_point: "https://example.com/pago-simulado" },
    }),
  });
});

const screenshots = {
  catalog: join(tmpdir(), "gloria-mobile-catalog.png"),
  product: join(tmpdir(), "gloria-mobile-product.png"),
  cart: join(tmpdir(), "gloria-mobile-cart.png"),
  checkout: join(tmpdir(), "gloria-mobile-checkout.png"),
};

await page.goto(`${baseUrl}/products?promo=UNIFORMES26`, {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(2500);
await page.screenshot({ path: screenshots.catalog, fullPage: true });
const catalog = await auditPage(page);

const productHref = await page
  .locator('main a[href^="/products/"]')
  .first()
  .getAttribute("href");
if (!productHref) throw new Error("No se encontro un producto navegable");

await page.goto(`${baseUrl}${productHref}`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1800);
await page.screenshot({ path: screenshots.product, fullPage: true });
const product = await auditPage(page);

const addToCartButton = page.getByTestId("add-to-cart-button");
const requiresSizeSelection = await addToCartButton.isDisabled();
const firstVariant = page
  .locator('[role="radiogroup"] [role="radio"]:not([disabled])')
  .first();
const firstVariantId = await firstVariant.getAttribute("id");
if (!firstVariantId) throw new Error("No se encontro un talle disponible");
await page.locator(`label[for="${firstVariantId}"]`).click();

await addToCartButton.click();
const cartDrawer = page.getByTestId("cart-drawer");
await cartDrawer.waitFor({ state: "visible" });
await page.waitForTimeout(500);
await page.screenshot({ path: screenshots.cart, fullPage: false });
const cart = await auditPage(page);
const drawer = await cartDrawer.evaluate((element) => {
  const rect = element.getBoundingClientRect();
  return {
    left: Math.round(rect.left),
    width: Math.round(rect.width),
    transform: getComputedStyle(element).transform,
    text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 1000),
  };
});

await page.getByTestId("cart-checkout-link").click();
await page.waitForURL("**/checkout");
await page.waitForTimeout(1200);
await page.screenshot({ path: screenshots.checkout, fullPage: true });
const checkout = await auditPage(page);
const couponValue = await page.getByLabel(/Código/).inputValue();

await page.getByLabel("Nombre").fill("Maria");
await page.getByLabel("Apellido").fill("Perez");
await page.getByLabel("Email").fill("maria@example.com");
await page.getByLabel(/Tel.fono/i).fill("3884123456");
await page.getByTestId("checkout-submit").click();
await page.waitForURL("https://example.com/pago-simulado");

const report = JSON.stringify(
  {
    productHref,
    requiresSizeSelection,
    couponValue,
    finalUrl: page.url(),
    screenshots,
    catalog,
    product,
    cart,
    drawer,
    checkout,
    consoleErrors,
  },
  null,
  2
);
await writeFile(join(tmpdir(), "gloria-mobile-audit.json"), report);
console.log(report);

await browser.close();
