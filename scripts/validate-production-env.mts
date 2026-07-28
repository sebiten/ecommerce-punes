const isProductionDeployment =
  process.env.VERCEL_ENV === "production" ||
  process.env.VALIDATE_PRODUCTION_ENV === "1";

if (isProductionDeployment) {
  const required = [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "CLERK_WEBHOOK_SECRET",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "MERCADOPAGO_ACCESS_TOKEN",
    "MERCADOPAGO_WEBHOOK_SECRET",
    "CRON_SECRET",
    "CHECKOUT_RATE_LIMIT_SECRET",
  ];
  const errors = required
    .filter((key) => !process.env[key]?.trim())
    .map((key) => `Falta ${key}`);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_")
  ) {
    errors.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY todavía es de desarrollo");
  }
  if (process.env.CLERK_SECRET_KEY?.startsWith("sk_test_")) {
    errors.push("CLERK_SECRET_KEY todavía es de desarrollo");
  }
  if (!appUrl.startsWith("https://") || /localhost|127\.0\.0\.1/.test(appUrl)) {
    errors.push("NEXT_PUBLIC_APP_URL debe ser una URL HTTPS pública");
  }

  if (errors.length > 0) {
    console.error("Configuración de producción inválida:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
}
