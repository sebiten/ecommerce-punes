import Link from "next/link";
import { DollarSign, ShoppingCart, Package, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export default async function DashboardPage() {
  const supabase = getSupabaseAdmin();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("active", true);

  const totalSales = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
  const pendingOrders =
    orders?.filter((o) => o.status === "pending" || o.status === "paid").length || 0;
  const totalProducts = products?.length || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido al panel de administración de Pune
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Ventas del mes"
          value={formatPrice(totalSales)}
          icon={DollarSign}
          description="Total de ventas"
        />
        <StatsCard
          title="Pedidos pendientes"
          value={pendingOrders}
          icon={ShoppingCart}
          description="Órdenes por procesar"
        />
        <StatsCard
          title="Productos activos"
          value={totalProducts}
          icon={Package}
          description="En el catálogo"
        />
        <StatsCard
          title="Ingresos"
          value={formatPrice(totalSales)}
          icon={TrendingUp}
          description="Este mes"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimos pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            {orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">
                        {order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatPrice(Number(order.total))}
                      </p>
                      <Badge
                        variant={
                          order.status === "paid"
                            ? "default"
                            : order.status === "pending"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay pedidos aún</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link
              href="/dashboard/products/new"
              className="rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <Package className="mb-2 h-5 w-5" />
              <p className="font-medium">Agregar producto</p>
              <p className="text-sm text-muted-foreground">
                Crear un nuevo producto en el catálogo
              </p>
            </Link>
            <Link
              href="/dashboard/orders"
              className="rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <ShoppingCart className="mb-2 h-5 w-5" />
              <p className="font-medium">Ver pedidos</p>
              <p className="text-sm text-muted-foreground">
                Gestionar órdenes de compra
              </p>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
