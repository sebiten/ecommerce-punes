export const dynamic = "force-dynamic";

import { getAddresses, getProfile } from "@/actions/auth";
import { getStoreSettings } from "@/actions/store-settings";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage() {
  const [addresses, profile, settings] = await Promise.all([
    getAddresses(),
    getProfile(),
    getStoreSettings(),
  ]);

  return <CheckoutForm addresses={addresses} profile={profile} settings={settings} />;
}
