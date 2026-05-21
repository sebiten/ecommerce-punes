import { getStoreSettings } from "@/actions/store-settings";
import { StorefrontShell } from "@/components/storefront/storefront-shell";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getStoreSettings();

  return <StorefrontShell settings={settings}>{children}</StorefrontShell>;
}
