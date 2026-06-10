"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Category, ProductWithDetails } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ImageIcon, Upload } from "lucide-react";
import { createProduct, updateProduct, uploadProductImage } from "@/actions/products";
import { slugify } from "@/lib/utils";

interface VariantFormValue {
  width: number;
  length: number;
  priceOverride: number | null;
  stock: number;
  active: boolean;
}

interface ImageFormValue {
  url: string;
  alt: string;
}

interface ProductFormProps {
  categories: Category[];
  mode: "create" | "edit";
  product?: ProductWithDetails;
}

const defaultVariants: VariantFormValue[] = [
  { width: 140, length: 190, priceOverride: null, stock: 0, active: true },
  { width: 160, length: 190, priceOverride: null, stock: 0, active: true },
];

function normalizeVariantValues(variants: VariantFormValue[]) {
  const variantsBySize = new Map<string, VariantFormValue>();

  for (const variant of variants) {
    if (variant.width <= 0 || variant.length <= 0) {
      continue;
    }

    const key = `${variant.width}x${variant.length}`;
    const existing = variantsBySize.get(key);

    if (!existing) {
      variantsBySize.set(key, { ...variant });
      continue;
    }

    variantsBySize.set(key, {
      ...existing,
      priceOverride: existing.priceOverride ?? variant.priceOverride ?? null,
      stock: Number(existing.stock || 0) + Number(variant.stock || 0),
      active: existing.active || variant.active,
    });
  }

  return Array.from(variantsBySize.values()).sort(
    (a, b) => a.width - b.width || a.length - b.length
  );
}

const MAX_IMAGE_DIMENSION = 1600;
const WEBP_QUALITY = 0.84;

async function convertImageToWebp(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecciona un archivo de imagen valido");
  }

  const imageBitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(imageBitmap.width, imageBitmap.height)
  );
  const width = Math.round(imageBitmap.width * scale);
  const height = Math.round(imageBitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    imageBitmap.close();
    throw new Error("No se pudo procesar la imagen");
  }

  context.drawImage(imageBitmap, 0, 0, width, height);
  imageBitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
  });

  if (!blob) {
    throw new Error("El navegador no pudo convertir la imagen a WebP");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "producto";
  return new File([blob], `${slugify(baseName)}.webp`, { type: "image/webp" });
}

export function ProductForm({ categories, mode, product }: ProductFormProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [basePrice, setBasePrice] = useState(String(product?.basePrice ?? ""));
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [active, setActive] = useState(product?.active ?? true);
  const [variants, setVariants] = useState<VariantFormValue[]>(
    product?.variants?.length
      ? normalizeVariantValues(
          product.variants.map((variant) => ({
            width: variant.width,
            length: variant.length,
            priceOverride: variant.priceOverride,
            stock: variant.stock,
            active: variant.active,
          }))
        )
      : defaultVariants
  );
  const [images, setImages] = useState<ImageFormValue[]>(
    product?.images?.length
      ? product.images.map((image) => ({
          url: image.url,
          alt: image.alt ?? "",
        }))
      : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateVariant = (
    index: number,
    field: keyof VariantFormValue,
    value: number | boolean | null
  ) => {
    setVariants((current) =>
      current.map((variant, currentIndex) =>
        currentIndex === index ? { ...variant, [field]: value } : variant
      )
    );
  };

  const updateImage = (index: number, field: keyof ImageFormValue, value: string) => {
    setImages((current) =>
      current.map((image, currentIndex) =>
        currentIndex === index ? { ...image, [field]: value } : image
      )
    );
  };

  const handleImageFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setIsUploadingImage(true);
    setError(null);

    try {
      const uploadedImages: ImageFormValue[] = [];

      for (const file of files) {
        const webpFile = await convertImageToWebp(file);
        const formData = new FormData();
        formData.append("file", webpFile);

        const uploaded = await uploadProductImage(formData);
        uploadedImages.push({
          url: uploaded.url,
          alt: name || file.name.replace(/\.[^.]+$/, ""),
        });
      }

      setImages((current) => [...current, ...uploadedImages]);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo subir la imagen"
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name,
        slug,
        description,
        basePrice: Number(basePrice),
        categoryId: categoryId || null,
        featured,
        active,
        images: images.filter((image) => image.url.trim()),
        variants: normalizeVariantValues(variants).map((variant) => ({
            ...variant,
            priceOverride:
              variant.priceOverride === null || Number.isNaN(variant.priceOverride)
                ? null
                : variant.priceOverride,
          })),
      };

      if (mode === "create") {
        await createProduct(payload);
      } else {
        await updateProduct(product!.id, payload);
      }

      window.location.href = "/dashboard/products";
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar el producto"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informacion basica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre del producto</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                if (!product?.slug || slug === product.slug || slug === slugify(name)) {
                  setSlug(slugify(nextName));
                }
              }}
              required
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descripcion</Label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="flex min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="basePrice">Precio base</Label>
              <Input
                id="basePrice"
                type="number"
                min="0"
                step="0.01"
                value={basePrice}
                onChange={(event) => setBasePrice(event.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="categoryId">Categoria</Label>
              <select
                id="categoryId"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Sin categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={featured}
                onChange={(event) => setFeatured(event.target.checked)}
              />
              Destacado
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
              />
              Activo
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Variantes</CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              setVariants((current) => [
                ...current,
                { width: 0, length: 0, priceOverride: null, stock: 0, active: true },
              ])
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar variante
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {variants.map((variant, index) => (
            <div
              key={`${variant.width}-${variant.length}-${index}`}
              className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-6"
            >
              <div>
                <Label>Ancho</Label>
                <Input
                  type="number"
                  min="0"
                  value={variant.width}
                  onChange={(event) =>
                    updateVariant(index, "width", Number(event.target.value))
                  }
                />
              </div>
              <div>
                <Label>Largo</Label>
                <Input
                  type="number"
                  min="0"
                  value={variant.length}
                  onChange={(event) =>
                    updateVariant(index, "length", Number(event.target.value))
                  }
                />
              </div>
              <div>
                <Label>Precio override</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={variant.priceOverride ?? ""}
                  onChange={(event) =>
                    updateVariant(
                      index,
                      "priceOverride",
                      event.target.value ? Number(event.target.value) : null
                    )
                  }
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={variant.stock}
                  onChange={(event) =>
                    updateVariant(index, "stock", Number(event.target.value))
                  }
                />
              </div>
              <label className="flex items-end gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={variant.active}
                  onChange={(event) =>
                    updateVariant(index, "active", event.target.checked)
                  }
                />
                Activa
              </label>
              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setVariants((current) =>
                      current.filter((_, currentIndex) => currentIndex !== index)
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Imagenes</CardTitle>
          <div>
            <Input
              id="productImages"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={isUploadingImage || isSubmitting}
              onChange={async (event) => {
                await handleImageFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              size="sm"
              disabled={isUploadingImage || isSubmitting}
              onClick={() => document.getElementById("productImages")?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploadingImage ? "Subiendo..." : "Subir imagen"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!images.length ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground">
              <ImageIcon className="mb-4 h-12 w-12" />
              <p>No hay imagenes cargadas.</p>
              <p className="mt-1 text-xs">
                Se convierten a WebP antes de subirlas a Supabase Storage.
              </p>
            </div>
          ) : null}

          {images.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-[8rem_1fr_auto]"
            >
              <div className="relative aspect-square overflow-hidden rounded-md border bg-muted">
                <Image
                  src={image.url}
                  alt={image.alt || name || "Producto"}
                  fill
                  className="object-cover"
                  sizes="8rem"
                />
              </div>
              <div>
                <Label>Alt</Label>
                <Input
                  value={image.alt}
                  onChange={(event) => updateImage(index, "alt", event.target.value)}
                />
                <p className="mt-2 break-all text-xs text-muted-foreground">
                  {image.url}
                </p>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setImages((current) =>
                      current.filter((_, currentIndex) => currentIndex !== index)
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex gap-4">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting
            ? "Guardando..."
            : mode === "create"
              ? "Crear producto"
              : "Guardar cambios"}
        </Button>
        <Button type="button" variant="outline" size="lg" asChild>
          <Link href="/dashboard/products">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
