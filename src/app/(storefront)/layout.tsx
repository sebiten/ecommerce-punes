import { getStoreSettings } from "@/actions/store-settings";
import { JsonLd } from "@/components/seo/json-ld";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { getStorefrontJsonLd } from "@/lib/seo";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getStoreSettings();

  return (
    <>
      <JsonLd data={getStorefrontJsonLd(settings)} />
      <StorefrontShell settings={settings}>{children}</StorefrontShell>
    </>
  );
}
