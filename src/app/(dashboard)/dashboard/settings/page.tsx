import { getStoreSettings } from "@/actions/store-settings";
import { StoreSettingsForm } from "@/components/dashboard/store-settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuracion</h1>
        <p className="text-muted-foreground">
          Datos reales del negocio, contacto y envios.
        </p>
      </div>

      <StoreSettingsForm settings={settings} />
    </div>
  );
}
