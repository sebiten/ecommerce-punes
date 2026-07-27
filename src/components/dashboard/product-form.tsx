"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import type { Category, ProductWithDetails } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
} from "@/actions/products";
import { slugify } from "@/lib/utils";

interface VariantFormValue {
  size: string;
  color: string;
  sku: string;
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
  {
    size: "S",
    color: "",
    sku: "",
    priceOverride: null,
    stock: 0,
    active: true,
  },
];

const MAX_IMAGE_DIMENSION = 1800;
const WEBP_QUALITY = 0.84;

function normalizeVariantValues(variants: VariantFormValue[]) {
  const normalized = new Map<string, VariantFormValue>();

  for (const variant of variants) {
    const size = variant.size.trim();
    const color = variant.color.trim();
    if (!size) continue;

    const key = `${size.toLocaleLowerCase("es-AR")}:${color.toLocaleLowerCase("es-AR")}`;
    const existing = normalized.get(key);

    if (!existing) {
      normalized.set(key, {
        ...variant,
        size,
        color,
        sku: variant.sku.trim(),
      });
      continue;
    }

    normalized.set(key, {
      ...existing,
      sku: existing.sku || variant.sku.trim(),
      priceOverride: existing.priceOverride ?? variant.priceOverride,
      stock: existing.stock + variant.stock,
      active: existing.active || variant.active,
    });
  }

  return Array.from(normalized.values());
}

async function convertImageToWebp(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Seleccioná un archivo de imagen válido");
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
  return new File([blob], `${slugify(baseName)}.webp`, {
    type: "image/webp",
  });
}

export function ProductForm({
  categories,
  mode,
  product,
}: ProductFormProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [sizeGuide, setSizeGuide] = useState(product?.sizeGuide ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [basePrice, setBasePrice] = useState(String(product?.basePrice ?? ""));
  const [compareAtPrice, setCompareAtPrice] = useState(
    product?.compareAtPrice ? String(product.compareAtPrice) : ""
  );
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [active, setActive] = useState(product?.active ?? true);
  const [variants, setVariants] = useState<VariantFormValue[]>(
    product?.variants?.length
      ? product.variants.map((variant) => ({
          size: variant.size,
          color: variant.color ?? "",
          sku: variant.sku ?? "",
          priceOverride: variant.priceOverride,
          stock: variant.stock,
          active: variant.active,
        }))
      : defaultVariants
  );
  const [images, setImages] = useState<ImageFormValue[]>(
    product?.images?.map((image) => ({
      url: image.url,
      alt: image.alt ?? "",
    })) ?? []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parentCategories = new Map(
    categories.map((category) => [category.id, category])
  );
  const sortedCategories = [...categories].sort((a, b) => {
    if (a.parent_id === b.id) return 1;
    if (b.parent_id === a.id) return -1;
    return a.sort_order - b.sort_order;
  });

  const updateVariant = (
    index: number,
    field: keyof VariantFormValue,
    value: string | number | boolean | null
  ) => {
    setVariants((current) =>
      current.map((variant, currentIndex) =>
        currentIndex === index ? { ...variant, [field]: value } : variant
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
        sizeGuide,
        brand: brand || null,
        basePrice: Number(basePrice),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        categoryId: categoryId || null,
        featured,
        active,
        images: images.filter((image) => image.url.trim()),
        variants: normalizeVariantValues(variants).map((variant) => ({
          ...variant,
          color: variant.color || null,
          sku: variant.sku || null,
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
          <CardTitle>Información de la prenda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre del producto" htmlFor="name">
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
            </Field>
            <Field label="Marca" htmlFor="brand">
              <Input
                id="brand"
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                placeholder="M51, Taverniti..."
              />
            </Field>
          </div>

          <Field label="Slug" htmlFor="slug">
            <Input
              id="slug"
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
              required
            />
          </Field>

          <Field label="Descripción" htmlFor="description">
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>

          <Field label="Guía de talles del producto" htmlFor="sizeGuide">
            <textarea
              id="sizeGuide"
              value={sizeGuide}
              onChange={(event) => setSizeGuide(event.target.value)}
              placeholder={"Ejemplo:\nS: contorno de pecho 86-92 cm\nM: contorno de pecho 93-99 cm"}
              className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Usá medidas reales del fabricante. No copies una tabla genérica si la prenda tiene otro calce.
            </p>
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Precio" htmlFor="basePrice">
              <Input id="basePrice" type="number" min="0" step="0.01" value={basePrice} onChange={(event) => setBasePrice(event.target.value)} required />
            </Field>
            <Field label="Precio anterior" htmlFor="compareAtPrice">
              <Input id="compareAtPrice" type="number" min="0" step="0.01" value={compareAtPrice} onChange={(event) => setCompareAtPrice(event.target.value)} />
            </Field>
            <Field label="Categoría" htmlFor="categoryId">
              <select
                id="categoryId"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Sin categoría</option>
                {sortedCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.parent_id
                      ? `${parentCategories.get(category.parent_id)?.name ?? ""} / `
                      : ""}
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex flex-wrap gap-6">
            <Check label="Destacado" checked={featured} onChange={setFeatured} />
            <Check label="Activo" checked={active} onChange={setActive} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Talles, colores y stock</CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              setVariants((current) => [
                ...current,
                {
                  size: "",
                  color: "",
                  sku: "",
                  priceOverride: null,
                  stock: 0,
                  active: true,
                },
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
              key={`${variant.size}-${variant.color}-${index}`}
              className="grid gap-4 rounded-xl border p-4 md:grid-cols-[0.75fr_1fr_1fr_1fr_0.75fr_auto]"
            >
              <Field label="Talle">
                <Input value={variant.size} onChange={(event) => updateVariant(index, "size", event.target.value)} placeholder="S, M, 42..." />
              </Field>
              <Field label="Color">
                <Input value={variant.color} onChange={(event) => updateVariant(index, "color", event.target.value)} placeholder="Azul" />
              </Field>
              <Field label="SKU">
                <Input value={variant.sku} onChange={(event) => updateVariant(index, "sku", event.target.value)} placeholder="Opcional" />
              </Field>
              <Field label="Precio especial">
                <Input type="number" min="0" step="0.01" value={variant.priceOverride ?? ""} onChange={(event) => updateVariant(index, "priceOverride", event.target.value ? Number(event.target.value) : null)} />
              </Field>
              <Field label="Stock">
                <Input type="number" min="0" value={variant.stock} onChange={(event) => updateVariant(index, "stock", Number(event.target.value))} />
              </Field>
              <div className="flex items-end gap-2">
                <Check label="Activa" checked={variant.active} onChange={(value) => updateVariant(index, "active", value)} />
                <Button type="button" variant="ghost" size="icon" aria-label="Eliminar variante" onClick={() => setVariants((current) => current.filter((_, currentIndex) => currentIndex !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Imágenes</CardTitle>
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
            <Button type="button" size="sm" disabled={isUploadingImage || isSubmitting} onClick={() => document.getElementById("productImages")?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {isUploadingImage ? "Subiendo..." : "Subir imágenes"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!images.length ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-muted-foreground">
              <ImageIcon className="mb-3 h-10 w-10" />
              <p>No hay imágenes cargadas.</p>
              <p className="mt-1 text-xs">Se convierten a WebP antes de subirlas a Supabase Storage.</p>
            </div>
          ) : null}

          {images.map((image, index) => (
            <div key={`${image.url}-${index}`} className="grid gap-4 rounded-xl border p-4 md:grid-cols-[8rem_1fr_auto]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg border bg-muted">
                <Image src={image.url} alt={image.alt || name || "Producto"} fill className="object-cover" sizes="8rem" />
              </div>
              <Field label="Texto alternativo">
                <Input
                  value={image.alt}
                  onChange={(event) =>
                    setImages((current) =>
                      current.map((item, currentIndex) =>
                        currentIndex === index
                          ? { ...item, alt: event.target.value }
                          : item
                      )
                    )
                  }
                />
              </Field>
              <div className="flex items-end">
                <Button type="button" variant="ghost" size="icon" aria-label="Eliminar imagen" onClick={() => setImages((current) => current.filter((_, currentIndex) => currentIndex !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting || isUploadingImage}>
          {isSubmitting ? "Guardando..." : "Guardar producto"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/products">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-10 items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
