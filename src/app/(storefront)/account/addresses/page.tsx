import { getAddresses } from "@/actions/auth";
import { AddressesManager } from "@/components/storefront/addresses-manager";

export const dynamic = "force-dynamic";

export default async function AccountAddressesPage() {
  const addresses = await getAddresses();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mis direcciones</h1>
        <p className="text-muted-foreground">
          Guarda y reutiliza direcciones para acelerar el checkout.
        </p>
      </div>

      <AddressesManager addresses={addresses} />
    </div>
  );
}
