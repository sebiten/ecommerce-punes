import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "./school-uniforms-carousel.module.css";

type SchoolIdentity = {
  name: string;
  level: string;
  mark: string;
  logo?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
};

const schools: SchoolIdentity[] = [
  {
    name: "Escuela N° 311 Bernardino Rivadavia",
    level: "Nivel primario",
    mark: "311",
    logo: {
      src: "/images/schools/uniforms/escuela-311.webp",
      alt: "Escudo bordado del uniforme de la Escuela N° 311",
      width: 512,
      height: 512,
    },
  },
  {
    name: "Escuela N° 261 Provincia de Tucumán",
    level: "Nivel primario",
    mark: "261",
  },
  {
    name: "Escuela Normal Superior General San Martín",
    level: "Primaria y secundaria",
    mark: "ENS",
    logo: {
      src: "/images/schools/uniforms/normal.webp",
      alt: "Insignia estampada del uniforme de la Escuela Normal Superior",
      width: 512,
      height: 512,
    },
  },
  {
    name: "Colegio Técnico Marista Ing. Herminio Arrieta",
    level: "Nivel secundario",
    mark: "ETHA",
    logo: {
      src: "/images/schools/uniforms/etha.webp",
      alt: "Insignia estampada del uniforme de ETHA",
      width: 512,
      height: 512,
    },
  },
  {
    name: "Colegio FASTA Ing. José María Paz",
    level: "Nivel primario",
    mark: "FASTA",
    logo: {
      src: "/images/schools/uniforms/fasta.webp",
      alt: "Escudo bordado del uniforme de FASTA",
      width: 512,
      height: 512,
    },
  },
  {
    name: "Colegio FASTA Ing. José María Paz",
    level: "Nivel secundario",
    mark: "FASTA",
    logo: {
      src: "/images/schools/uniforms/fasta.webp",
      alt: "Escudo bordado del uniforme de FASTA",
      width: 512,
      height: 512,
    },
  },
  {
    name: "Escuela N° 3 Enrique Wollmann",
    level: "Nivel primario",
    mark: "N° 3",
    logo: {
      src: "/images/schools/uniforms/wallman.webp",
      alt: "Insignia estampada del uniforme de la Escuela Enrique Wollmann",
      width: 512,
      height: 512,
    },
  },
  {
    name: "Escuela Provincial de Artes N° 3 Lola Mora",
    level: "Nivel secundario",
    mark: "ARTES",
    logo: {
      src: "/images/schools/uniforms/lola-mora.webp",
      alt: "Escudo bordado del uniforme de la Escuela Lola Mora",
      width: 512,
      height: 512,
    },
  },
  {
    name: "Escuela Provincial Agrotécnica N° 4",
    level: "Nivel secundario",
    mark: "AGRO 4",
  },
  {
    name: "Escuela Provincial de Comercio N° 4",
    level: "25 de Febrero · Secundaria",
    mark: "COM 4",
    logo: {
      src: "/images/schools/uniforms/comercial-4.webp",
      alt: "Insignia estampada del uniforme de la Escuela de Comercio N° 4",
      width: 512,
      height: 512,
    },
  },
  {
    name: "Escuela de Comercio N° 6",
    level: "Nivel secundario",
    mark: "COM 6",
    logo: {
      src: "/images/schools/uniforms/comercial-6.webp",
      alt: "Insignia estampada del uniforme de la Escuela de Comercio N° 6",
      width: 512,
      height: 512,
    },
  },
  {
    name: "Escuela N° 112 Coronel Manuel Dorrego",
    level: "Nivel primario",
    mark: "112",
    logo: {
      src: "/images/schools/uniforms/dorrego.webp",
      alt: "Escudo bordado del uniforme de la Escuela Coronel Manuel Dorrego",
      width: 512,
      height: 512,
    },
  },
  {
    name: "Bachillerato Provincial N° 7 de Calilegua",
    level: "Nivel secundario",
    mark: "BACH 7",
    logo: {
      src: "/images/schools/uniforms/bachillerato-calilegua.webp",
      alt: "Insignia bordada del uniforme del Bachillerato de Calilegua",
      width: 512,
      height: 512,
    },
  },
  {
    name: "Escuela Cooperativa Libertad",
    level: "Nivel primario",
    mark: "COOP",
    logo: {
      src: "/images/schools/uniforms/cooperativa.webp",
      alt: "Insignia estampada del uniforme de la Escuela Cooperativa Libertad",
      width: 512,
      height: 512,
    },
  },
  {
    name: "Escuela N° 213 Martín Raúl Galán",
    level: "Nivel primario",
    mark: "213",
    logo: {
      src: "/images/schools/uniforms/galan.webp",
      alt: "Escudo estampado del uniforme de la Escuela Martín Raúl Galán",
      width: 512,
      height: 512,
    },
  },
];

const schoolSearchTerms: Record<string, string> = {
  "311": "311",
  "261": "261",
  ENS: "Normal",
  ETHA: "ETHA",
  FASTA: "FASTA",
  "N° 3": "Wollmann",
  ARTES: "Lola Mora",
  "AGRO 4": "Agrotécnica",
  "COM 4": "Comercio N° 4",
  "COM 6": "Comercio N° 6",
  "112": "Dorrego",
  "BACH 7": "Calilegua",
  COOP: "Cooperativa",
  "213": "Galán",
};

function getWhatsappUrl(phone: string | null | undefined) {
  const normalizedPhone = phone?.replace(/\D/g, "");
  if (!normalizedPhone) return null;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
    "Hola, busco un uniforme que no aparece en la tienda. Escuela: __. Prenda: __. Talle: __."
  )}`;
}

function SchoolCard({
  school,
  duplicate = false,
}: {
  school: SchoolIdentity;
  duplicate?: boolean;
}) {
  const query = schoolSearchTerms[school.mark] ?? school.name;
  const productUrl = `/products?category=uniformes-escolares&q=${encodeURIComponent(query)}`;
  const content = (
    <>
      <span className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-gloria-200 bg-gloria-50 px-2 text-center">
        {school.logo ? (
          <Image
            src={school.logo.src}
            alt={school.logo.alt}
            width={school.logo.width}
            height={school.logo.height}
            className="max-h-12 w-auto object-contain"
          />
        ) : (
          <span className="font-display text-xl leading-none text-gloria-900">
            {school.mark}
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span className="line-clamp-2 text-sm font-extrabold leading-5 text-gloria-950">
          {school.name}
        </span>
        <span className="mt-1 block text-xs font-medium text-muted-foreground">
          {school.level}
        </span>
      </span>
      <ArrowRight className="ml-auto size-4 shrink-0 text-gloria-700" />
    </>
  );
  const className =
    "flex h-28 w-[19rem] shrink-0 items-center gap-3 rounded-3xl border border-gloria-200 bg-white p-4 shadow-[0_12px_35px_-28px_oklch(0.35_0.085_134/0.55)] transition hover:-translate-y-0.5 hover:border-gloria-400 hover:shadow-[0_18px_40px_-26px_oklch(0.35_0.085_134/0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gloria-600 focus-visible:ring-offset-2";

  return (
    <Link
      href={productUrl}
      className={className}
      tabIndex={duplicate ? -1 : undefined}
      aria-label={`Ver uniformes de ${school.name}`}
    >
      {content}
    </Link>
  );
}

export function SchoolUniformsCarousel({
  whatsappPhone,
}: {
  whatsappPhone?: string | null;
}) {
  const whatsappUrl = getWhatsappUrl(whatsappPhone);

  return (
    <section
      id="escuelas"
      className="scroll-mt-24 border-y border-gloria-200 bg-[linear-gradient(180deg,#fff_0%,var(--color-gloria-50)_100%)] py-12 sm:py-16"
    >
      <div className="container mx-auto px-4">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gloria-700">
              Uniformes por institución
            </p>
            <h2 className="mt-3 font-display text-3xl text-gloria-950 sm:text-5xl">
              Buscá tu escuela en Ledesma.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Indicá institución, nivel, prenda y talle. Confirmamos el modelo y
              el stock antes de preparar tu pedido.
            </p>
          </div>
          <Button variant="outline" className="w-fit rounded-full bg-white" asChild>
            <Link href="/products?category=uniformes-escolares">
              Ver tienda de uniformes
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className={styles.viewport}>
        <div className={styles.track}>
          <div className={styles.group}>
            {schools.map((school) => (
              <SchoolCard
                key={`${school.name}-${school.level}`}
                school={school}
              />
            ))}
          </div>
          <div
            className={`${styles.group} ${styles.duplicate}`}
            aria-hidden="true"
          >
            {schools.map((school) => (
              <SchoolCard
                key={`duplicate-${school.name}-${school.level}`}
                school={school}
                duplicate
              />
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto mt-7 flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
          Las instituciones se mencionan únicamente para identificar el uniforme.
          Pilchería Gloria no representa ni mantiene afiliación oficial con ellas.
        </p>
        {whatsappUrl ? (
          <Button className="w-fit shrink-0 rounded-full" asChild>
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 size-4" />
              Consultar otra escuela
            </a>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
