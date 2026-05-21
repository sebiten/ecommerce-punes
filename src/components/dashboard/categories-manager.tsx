"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { slugify } from "@/lib/utils";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CategoryWithCount,
} from "@/actions/categories";

interface CategoryFormState {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: string;
}

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  sortOrder: "0",
};

interface CategoriesManagerProps {
  initialCategories: CategoryWithCount[];
}

export function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(form.id);

  const resetForm = () => {
    setForm(emptyForm);
    setError(null);
    setIsOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      imageUrl: form.imageUrl || null,
      sortOrder: Number(form.sortOrder) || 0,
    };

    try {
      if (isEditing) {
        await updateCategory(form.id!, payload);
        setCategories((current) =>
          current.map((category) =>
            category.id === form.id
              ? {
                  ...category,
                  name: payload.name,
                  slug: payload.slug,
                  description: payload.description,
                  image_url: payload.imageUrl,
                  sort_order: payload.sortOrder,
                }
              : category
          )
        );
      } else {
        const category = await createCategory(payload);
        setCategories((current) => [...current, { ...category, productCount: 0 }]);
      }

      resetForm();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar la categoria"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    const confirmed = window.confirm("Eliminar esta categoria?");
    if (!confirmed) return;

    try {
      await deleteCategory(categoryId);
      setCategories((current) =>
        current.filter((category) => category.id !== categoryId)
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No se pudo eliminar la categoria"
      );
    }
  };

  const startEdit = (category: CategoryWithCount) => {
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      imageUrl: category.image_url || "",
      sortOrder: String(category.sort_order),
    });
    setError(null);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">
            {categories.length} categorias en el sitio
          </p>
        </div>
        <Button
          onClick={() => {
            if (isOpen && !isEditing) {
              resetForm();
              return;
            }

            setForm(emptyForm);
            setError(null);
            setIsOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva categoria
        </Button>
      </div>

      {isOpen ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {isEditing ? "Editar categoria" : "Crear categoria"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(event) => {
                      const nextName = event.target.value;
                      setForm((current) => ({
                        ...current,
                        name: nextName,
                        slug:
                          !current.id || current.slug === slugify(current.name)
                            ? slugify(nextName)
                            : current.slug,
                      }));
                    }}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        slug: slugify(event.target.value),
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripcion</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="imageUrl">Imagen URL</Label>
                  <Input
                    id="imageUrl"
                    value={form.imageUrl}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        imageUrl: event.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="sortOrder">Orden</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min="0"
                    value={form.sortOrder}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sortOrder: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Guardando..."
                    : isEditing
                      ? "Guardar cambios"
                      : "Crear categoria"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-12 px-4 text-left font-medium">Nombre</th>
                  <th className="h-12 px-4 text-left font-medium">Slug</th>
                  <th className="h-12 px-4 text-left font-medium">Productos</th>
                  <th className="h-12 px-4 text-left font-medium">Orden</th>
                  <th className="h-12 px-4 text-left font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b">
                    <td className="p-4 font-medium">{category.name}</td>
                    <td className="p-4 text-muted-foreground">{category.slug}</td>
                    <td className="p-4">{category.productCount}</td>
                    <td className="p-4">{category.sort_order}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
                          disabled={category.productCount > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!categories.length ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No hay categorias todavia.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
