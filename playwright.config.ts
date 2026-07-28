import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

for (const envFile of [".env.test.local", ".env.local"]) {
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (!match || match[1].startsWith("#")) continue;
      process.env[match[1]] ??= match[2]?.replace(/^["']|["']$/g, "") ?? "";
    }
  }
}

process.env.E2E_MERCADOPAGO_FAKE = "1";
process.env.CRON_SECRET ??= "e2e-order-cron-secret";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    env: {
      E2E_MERCADOPAGO_FAKE: "1",
      E2E_ALLOW_REMOTE_DB: process.env.E2E_ALLOW_REMOTE_DB || "0",
      CRON_SECRET: process.env.CRON_SECRET,
    },
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
