import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "product-images";
const VERSION = "v2-original-background";

const UNIFORMS: Record<string, string> = {
  "chomba-escuela-normal": "normal-chomba.webp",
  "remera-escuela-normal": "normal-remera.webp",
  "chomba-escuela-311": "311-chomba.webp",
  "remera-escuela-enrique-wollmann": "wallman-remera.webp",
  "chomba-escuela-enrique-wollmann": "wallman-chomba.webp",
  "chomba-colegio-fasta": "fasta-chomba.webp",
  "remera-colegio-fasta": "fasta-remera.webp",
  "chomba-escuela-artes-lola-mora":
    "lola-mora-escuela-de-arte-chomba.webp",
  "remera-escuela-artes-lola-mora":
    "lola-mora-escuela-de-artes-remera.webp",
  "remera-escuela-comercial-4": "comercial-4-remera.webp",
  "chomba-escuela-comercial-6": "comercial-6-chomba.webp",
  "remera-escuela-martin-raul-galan": "galan-remera.webp",
  "chomba-etha-segunda-seleccion": "etha-chomba-manchada.webp",
  "remera-etha": "etha-remera.webp",
  "chomba-escuela-cooperativa-libertad": "coperativa-chomba.webp",
  "chomba-escuela-coronel-dorrego": "dorrego-chomba.webp",
  "remera-bachillerato-7-calilegua": "bachillerato-calilegua-remera.webp",
  "chomba-bachillerato-7-calilegua": "bachillerato-calilegua-chomba.webp",
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const imageDirectory = path.join(
  process.cwd(),
  "public",
  "images",
  "uniforms",
  "catalog"
);

for (const [slug, filename] of Object.entries(UNIFORMS)) {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .single();

  if (productError || !product) {
    throw new Error(`No se encontró ${slug}: ${productError?.message}`);
  }

  const objectPath = `uniformes/${slug}/${VERSION}.webp`;
  const image = await readFile(path.join(imageDirectory, filename));
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, image, {
      cacheControl: "31536000",
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`No se pudo subir ${filename}: ${uploadError.message}`);
  }

  const { data: publicUrl } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(objectPath);
  const { error: updateError } = await supabase
    .from("product_images")
    .update({ url: publicUrl.publicUrl })
    .eq("product_id", product.id)
    .eq("sort_order", 0);

  if (updateError) {
    throw new Error(`No se pudo actualizar ${slug}: ${updateError.message}`);
  }

  console.log(`${slug} -> ${objectPath}`);
}
