import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Ruler,
  School,
  Shirt,
} from "lucide-react";
import { getProducts } from "@/actions/products";
import { getStoreSettings } from "@/actions/store-settings";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Button } from "@/components/ui/button";
import { getBreadcrumbJsonLd } from "@/lib/seo";
import {
  absoluteUrl,
  SCHOOL_UNIFORMS_DESCRIPTION,
  SITE_LOCALITY,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Uniformes escolares en Ledesma, Jujuy",
  description: SCHOOL_UNIFORMS_DESCRIPTION,
  alternates: { canonical: "/uniformes-escolares-ledesma" },
  openGraph: {
    type: "website",
    title: "Uniformes escolares en Ledesma, Jujuy",
    description: SCHOOL_UNIFORMS_DESCRIPTION,
    url: "/uniformes-escolares-ledesma",
  },
  twitter: {
    card: "summary_large_image",
    title: "Uniformes escolares en Ledesma, Jujuy",
    description: SCHOOL_UNIFORMS_DESCRIPTION,
  },
};

const UNIFORMS_IMAGE =
  "https://images.unsplash.com/photo-1612229693210-30e16029c415?auto=format&fit=crop&w=1400&q=84";

const garments = [
  {
    number: "01",
    name: "Remeras escolares",
    description: "Manga corta o larga, según el uniforme de cada institución.",
  },
  {
    number: "02",
    name: "Camisas escolares",
    description: "Modelos para primaria y secundaria, con talles infantiles y juveniles.",
  },
  {
    number: "03",
    name: "Pantalones escolares",
    description: "Opciones cómodas para el uso diario y el talle que necesitás.",
  },
  {
    number: "04",
    name: "Medias escolares",
    description: "Colores y largos para completar el uniforme de cada escuela.",
  },
];

const faqs = [
  {
    question: "¿Trabajan uniformes para todas las escuelas de Ledesma?",
    answer:
      "Tomamos consultas para escuelas primarias y secundarias de Ledesma. Para confirmar el modelo correcto, indicanos la institución, el nivel y la prenda que necesitás.",
  },
  {
    question: "¿Hay talles para primaria y secundaria?",
    answer:
      "Trabajamos talles infantiles, juveniles y de adulto. La disponibilidad exacta se confirma según la prenda y el stock vigente.",
  },
  {
    question: "¿Qué prendas puedo pedir?",
    answer:
      "Podés consultar por remeras, camisas, pantalones y medias escolares, además de otras prendas específicas solicitadas por cada institución.",
  },
  {
    question: "¿Cómo confirmo el uniforme correcto?",
    answer:
      "Enviá por WhatsApp el nombre de la escuela, el nivel, la prenda y el talle. Si tenés una foto o indicación del colegio, también podés adjuntarla.",
  },
  {
    question: `¿Puedo retirar en ${SITE_LOCALITY}?`,
    answer:
      "Sí, cuando el retiro esté habilitado coordinamos día y horario después de confirmar el pedido.",
  },
];

export default async function SchoolUniformsLedesmaPage() {
  const [products, settings] = await Promise.all([
    getProducts({ categorySlug: "uniformes-escolares" }),
    getStoreSettings(),
  ]);
  const whatsappUrl = settings.whatsapp_phone
    ? `https://wa.me/${settings.whatsapp_phone.replace(/\D/g, "")}?text=${encodeURIComponent(
        "Hola, busco un uniforme escolar en Ledesma. Escuela: __. Nivel: primaria/secundaria. Prenda: __. Talle: __."
      )}`
    : null;
  const itemList = {
    "@type": "ItemList",
    name: "Uniformes escolares disponibles",
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/products/${product.slug}`),
      name: product.name,
      image: product.images[0]?.url,
    })),
  };
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": absoluteUrl("/uniformes-escolares-ledesma#collection"),
        name: "Uniformes escolares en Ledesma, Jujuy",
        description: SCHOOL_UNIFORMS_DESCRIPTION,
        url: absoluteUrl("/uniformes-escolares-ledesma"),
        inLanguage: "es-AR",
        mainEntity: itemList,
      },
      itemList,
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
      getBreadcrumbJsonLd([
        { name: "Inicio", path: "/" },
        {
          name: "Uniformes escolares en Ledesma",
          path: "/uniformes-escolares-ledesma",
        },
      ]),
    ],
  };

  return (
    <main className="overflow-hidden bg-background">
      <JsonLd data={pageJsonLd} />

      <section className="relative isolate border-b border-gloria-200 bg-gloria-50">
        <div className="absolute -left-32 top-12 size-80 rounded-full bg-gloria-300/35 blur-3xl" />
        <div className="container relative mx-auto grid gap-9 px-4 py-10 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gloria-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-gloria-800">
              <MapPin className="size-4" />
              Libertador · Ledesma · Jujuy
            </div>
            <h1 className="mt-6 font-display text-balance text-5xl leading-[0.94] text-gloria-950 sm:text-7xl">
              Uniformes escolares para cada etapa.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Para todas las escuelas primarias y secundarias de Ledesma.
              Consultá por remeras, camisas, pantalones y medias en todos los
              talles, sujetos a disponibilidad.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="min-h-12 rounded-full px-7" asChild>
                <Link href="#uniformes-disponibles">
                  Ver uniformes
                  <ArrowDown className="ml-2 size-4" />
                </Link>
              </Button>
              {whatsappUrl ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-12 rounded-full border-gloria-300 bg-white px-7"
                  asChild
                >
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 size-4" />
                    Consultar por mi escuela
                  </a>
                </Button>
              ) : null}
            </div>
            <ul className="mt-8 grid gap-3 text-sm font-semibold text-gloria-950 sm:grid-cols-3">
              <li className="flex items-center gap-2">
                <School className="size-4 text-gloria-700" />
                Primaria y secundaria
              </li>
              <li className="flex items-center gap-2">
                <Ruler className="size-4 text-gloria-700" />
                Todos los talles
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-gloria-700" />
                Stock confirmado
              </li>
            </ul>
          </div>

          <div className="relative min-h-[25rem] sm:min-h-[34rem]">
            <div className="absolute inset-0 overflow-hidden rounded-[2.5rem_1rem_2.5rem_1rem] border border-gloria-200 bg-white shadow-[0_30px_70px_-45px_oklch(0.35_0.085_134/0.45)]">
              <Image
                src={UNIFORMS_IMAGE}
                alt="Uniformes escolares para estudiantes de primaria y secundaria"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gloria-950/50 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-4 left-5 right-5 rounded-2xl border border-gloria-200 bg-white p-4 shadow-xl sm:left-8 sm:right-auto sm:max-w-xs">
              <p className="font-bold text-gloria-950">Pedí el modelo correcto</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Decinos escuela, nivel, prenda y talle antes de confirmar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-white py-14 sm:py-18">
        <div className="container mx-auto px-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gloria-700">
            El uniforme completo
          </p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
            <h2 className="font-display text-4xl text-gloria-950 sm:text-5xl">
              Todo lo que necesitás para el colegio.
            </h2>
            <div className="border-t border-gloria-200">
              {garments.map((garment) => (
                <article
                  key={garment.name}
                  className="grid gap-2 border-b border-gloria-200 py-5 sm:grid-cols-[3rem_0.7fr_1fr] sm:items-start"
                >
                  <span className="text-xs font-black text-gloria-700">
                    {garment.number}
                  </span>
                  <h3 className="font-bold text-gloria-950">{garment.name}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {garment.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="uniformes-disponibles"
        className="scroll-mt-24 bg-gloria-50 py-14 sm:py-18"
      >
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gloria-700">
                Catálogo escolar
              </p>
              <h2 className="mt-2 font-display text-4xl text-gloria-950 sm:text-5xl">
                Uniformes disponibles
              </h2>
            </div>
            <Link
              href="/categories/uniformes-escolares"
              className="text-sm font-bold text-gloria-800 underline-offset-4 hover:underline"
            >
              Ver colección completa
            </Link>
          </div>
          {products.length ? (
            <ProductGrid products={products} priorityFirst={4} />
          ) : (
            <div className="rounded-3xl border border-dashed border-gloria-300 bg-white px-6 py-12 text-center">
              <Shirt className="mx-auto size-7 text-gloria-700" />
              <h3 className="mt-4 font-display text-2xl text-gloria-950">
                Consultá por el uniforme de tu escuela
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Estamos cargando el catálogo escolar. Mientras tanto, podemos
                confirmar prendas, talles y disponibilidad por WhatsApp.
              </p>
              {whatsappUrl ? (
                <Button className="mt-6 rounded-full" asChild>
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    Consultar disponibilidad
                  </a>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-border bg-white py-14 sm:py-18">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gloria-700">
                Compra sin dudas
              </p>
              <h2 className="mt-3 font-display text-4xl text-gloria-950 sm:text-5xl">
                Cuatro datos y buscamos tu uniforme.
              </h2>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2">
              {["Escuela", "Nivel", "Prenda", "Talle"].map((step, index) => (
                <li
                  key={step}
                  className="flex min-h-24 items-center gap-4 rounded-2xl border border-gloria-200 bg-gloria-50 p-5"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gloria-500 text-sm font-black text-gloria-950">
                    {index + 1}
                  </span>
                  <span className="font-bold text-gloria-950">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-background py-14 sm:py-18">
        <div className="container mx-auto max-w-4xl px-4">
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-gloria-700">
            Preguntas frecuentes
          </p>
          <h2 className="mt-3 text-center font-display text-4xl text-gloria-950 sm:text-5xl">
            Antes de elegir el uniforme
          </h2>
          <div className="mt-8 divide-y divide-gloria-200 border-y border-gloria-200">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-gloria-950">
                  {faq.question}
                  <span className="text-xl text-gloria-700 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl pr-10 text-sm leading-7 text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
