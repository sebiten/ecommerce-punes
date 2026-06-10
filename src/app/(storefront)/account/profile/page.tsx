import Link from "next/link";
import { getProfile } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export default async function AccountProfilePage() {
  const profile = await getProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Datos principales de tu cuenta.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <dl className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="font-semibold">Nombre</dt>
            <dd className="mt-1 text-muted-foreground">
              {profile?.full_name || "No informado"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Email</dt>
            <dd className="mt-1 text-muted-foreground">
              {profile?.email || "No informado"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Telefono</dt>
            <dd className="mt-1 text-muted-foreground">
              {profile?.phone || "No informado"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Tipo de cuenta</dt>
            <dd className="mt-1 capitalize text-muted-foreground">
              {profile?.role || "client"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/account/orders">Ver pedidos</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/account/addresses">Gestionar direcciones</Link>
        </Button>
        {profile?.role === "admin" ? (
          <Button variant="outline" asChild>
            <Link href="/dashboard">Ir al dashboard</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
