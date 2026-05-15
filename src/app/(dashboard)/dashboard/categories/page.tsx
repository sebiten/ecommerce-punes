"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([
    { id: "1", name: "Colchones", slug: "colchones", productCount: 12 },
    { id: "2", name: "Sommiers", slug: "sommiers", productCount: 8 },
    { id: "3", name: "Accesorios", slug: "accesorios", productCount: 15 },
  ]);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categorías</h1>
          <p className="text-muted-foreground">
            {categories.length} categorías en el sitio
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva categoría
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Crear categoría</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input placeholder="Nombre de la categoría" />
            </div>
            <div className="flex gap-2">
              <Button>Crear categoría</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-12 px-4 text-left align-middle font-medium">
                    Nombre
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium">
                    Slug
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium">
                    Productos
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b">
                    <td className="p-4 font-medium">{category.name}</td>
                    <td className="p-4 text-muted-foreground">
                      {category.slug}
                    </td>
                    <td className="p-4">{category.productCount}</td>
                    <td className="p-4">
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}