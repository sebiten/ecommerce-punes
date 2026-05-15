"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Array<{id: string; code: string; type: string; value: number}>>([]);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cupones</h1>
          <p className="text-muted-foreground">
            Gestioná los cupones de descuento
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo cupón
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Crear cupón</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código</Label>
                <Input placeholder="DESCUENTO20" />
              </div>
              <div>
                <Label>Tipo</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="percentage">Porcentage</option>
                  <option value="fixed">Monto fijo</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor</Label>
                <Input type="number" placeholder="20" />
              </div>
              <div>
                <Label>Compra mínima</Label>
                <Input type="number" placeholder="50000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Usos máximos</Label>
                <Input type="number" placeholder="100" />
              </div>
              <div>
                <Label>Fecha de expiración</Label>
                <Input type="date" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button>Crear cupón</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          {coupons.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay cupones creados. Usá el botón de arriba para crear uno nuevo.
            </p>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{coupon.code}</p>
                    <p className="text-sm text-muted-foreground">
                      {coupon.type === "percentage"
                        ? `${coupon.value}% OFF`
                        : `$${coupon.value} OFF`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}