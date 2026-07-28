import { getStoreSettings } from "@/actions/store-settings";
import { StoreSettingsForm } from "@/components/dashboard/store-settings-form";
import { requireAdmin } from "@/actions/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuracion</h1>
        <p className="text-muted-foreground">
          Datos reales del negocio, contacto y envíos.
        </p>
      </div>

      <StoreSettingsForm settings={settings} />
    </div>
  );
}
