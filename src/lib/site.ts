export const SITE_NAME = "Pilchería Gloria";
export const SITE_DESCRIPTION =
  "Ropa para mujer y hombre en Libertador General San Martín, Jujuy. Compra online y retiro coordinado.";

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/+$/,
    ""
  );
}

export function absoluteUrl(path = "/") {
  return new URL(path, `${getSiteUrl()}/`).toString();
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
