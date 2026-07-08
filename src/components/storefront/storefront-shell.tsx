import { Footer } from "@/components/storefront/footer";
import { StorefrontClientShell } from "@/components/storefront/storefront-client-shell";
import { WhatsAppFloatingButton } from "@/components/storefront/whatsapp-floating-button";
import type { StoreSettings } from "@/types";

interface StorefrontShellProps {
  children: React.ReactNode;
  settings: StoreSettings;
}

export function StorefrontShell({ children, settings }: StorefrontShellProps) {
  return (
    <>
      <StorefrontClientShell>{children}</StorefrontClientShell>
      <WhatsAppFloatingButton />
      <Footer settings={settings} />
    </>
  );
}
