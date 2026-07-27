import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/storefront/legal-page";

export const metadata: Metadata = {
  title: "Guía de talles de ropa y uniformes escolares",
  description:
    "Cómo tomar medidas para elegir remeras, camisas, pantalones y uniformes escolares.",
  alternates: { canonical: "/guia-de-talles" },
};

const measurements = [
  ["Pecho", "Rodeá la parte más amplia del pecho sin ajustar la cinta."],
  ["Cintura", "Medí alrededor de la cintura natural, manteniendo la cinta horizontal."],
  ["Cadera", "Rodeá la parte más amplia de la cadera con los pies juntos."],
  ["Largo", "Compará desde el punto indicado en la ficha con una prenda que te quede bien."],
];

export default function SizeGuidePage() {
  return (
    <LegalPage
      eyebrow="Elegí mejor"
      title="Guía de talles"
      intro="Las medidas cambian según la marca y el calce. Usá la tabla específica del producto y comparala con una prenda similar."
    >
      <LegalSection title="Cómo medirte">
        <div className="grid gap-3 sm:grid-cols-2">
          {measurements.map(([title, description]) => (
            <div key={title} className="rounded-2xl border border-gloria-200 bg-gloria-50/60 p-4">
              <h3 className="font-bold text-gloria-950">{title}</h3>
              <p className="mt-1">{description}</p>
            </div>
          ))}
        </div>
      </LegalSection>
      <LegalSection title="Antes de comprar">
        <p>Medite con ropa liviana y sin apretar la cinta métrica.</p>
        <p>Si quedás entre dos talles, revisá el tipo de calce o consultanos por WhatsApp.</p>
        <p>En uniformes escolares, confirmá escuela, curso, prenda y talle antes de pagar.</p>
      </LegalSection>
    </LegalPage>
  );
}
