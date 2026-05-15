"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ImageIcon } from "lucide-react";

interface Variant {
  width: number;
  length: number;
  priceOverride: number;
  stock: number;
}

interface Image {
  url: string;
  alt: string;
}

export default function NewProductPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [featured, setFeatured] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([
    { width: 140, length: 190, priceOverride: 0, stock: 0 },
    { width: 160, length: 190, priceOverride: 0, stock: 0 },
    { width: 180, length: 200, priceOverride: 0, stock: 0 },
    { width: 200, length: 200, priceOverride: 0, stock: 0 },
  ]);
  const [images, setImages] = useState<Image[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSlugify = (text: string) => {
    const slugified = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .trim();
    setSlug(slugified);
  };

  const addVariant = () => {
    setVariants([...variants, { width: 0, length: 0, priceOverride: 0, stock: 0 }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const addImage = () => {
    setImages([...images, { url: "", alt: "" }]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateImage = (index: number, field: keyof Image, value: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], [field]: value };
    setImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          basePrice: parseFloat(basePrice),
          categoryId,
          featured,
          variants,
          images,
        }),
      });

      if (response.ok) {
        window.location.href = "/dashboard/products";
      }
    } catch (error) {
      console.error("Error creating product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo producto</h1>
        <p className="text-muted-foreground">
          Agregá un nuevo producto al catálogo
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del producto</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug || slug === e.target.value.toLowerCase().replace(/\s+/g, "-")) {
                    handleSlugify(e.target.value);
                  }
                }}
                placeholder="Colchón Pune Premium"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="colchon-pune-premium"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción detallada del producto..."
                className="flex min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="basePrice">Precio base</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="150000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="categoryId">Categoría</Label>
                <select
                  id="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Sin categoría</option>
                  <option value="colchones">Colchones</option>
                  <option value="sommiers">Sommiers</option>
                  <option value="accesorios">Accesorios</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="featured">Producto destacado</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Variantes (tamaños)</CardTitle>
            <Button type="button" size="sm" onClick={addVariant}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar variante
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {variants.map((variant, index) => (
              <div key={index} className="grid grid-cols-5 gap-4 items-end">
                <div>
                  <Label>Ancho (cm)</Label>
                  <Input
                    type="number"
                    value={variant.width}
                    onChange={(e) =>
                      updateVariant(index, "width", parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label>Largo (cm)</Label>
                  <Input
                    type="number"
                    value={variant.length}
                    onChange={(e) =>
                      updateVariant(index, "length", parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label>Precio override</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variant.priceOverride}
                    onChange={(e) =>
                      updateVariant(index, "priceOverride", parseFloat(e.target.value))
                    }
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={variant.stock}
                    onChange={(e) =>
                      updateVariant(index, "stock", parseInt(e.target.value))
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeVariant(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Imágenes</CardTitle>
            <Button type="button" size="sm" onClick={addImage}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar imagen
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-4" />
                <p>No hay imágenes. Agregá una usando el botón de arriba.</p>
              </div>
            ) : (
              images.map((image, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label>URL de la imagen</Label>
                    <Input
                      value={image.url}
                      onChange={(e) => updateImage(index, "url", e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Texto alternativo</Label>
                    <Input
                      value={image.alt}
                      onChange={(e) => updateImage(index, "alt", e.target.value)}
                      placeholder="Colchón Pune Premium vista frontal"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeImage(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}

            {images.length > 0 && images[0].url && (
              <div className="relative mt-4 aspect-video w-full max-w-sm overflow-hidden rounded-lg border">
                <Image
                  src={images[0].url}
                  alt={images[0].alt || "Preview"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear producto"}
          </Button>
          <Button type="button" variant="outline" size="lg" asChild>
            <a href="/dashboard/products">Cancelar</a>
          </Button>
        </div>
      </form>
    </div>
  );
}