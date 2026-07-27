import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/storefront/legal-page";
import { WithdrawalForm } from "@/components/storefront/withdrawal-form";

export const metadata: Metadata = {
  title: "Botón de arrepentimiento",
  description: "Solicitud de revocación para compras realizadas a distancia.",
  alternates: { canonical: "/arrepentimiento" },
};

export default function WithdrawalPage() {
  return (
    <LegalPage
      eyebrow="Compra online"
      title="Botón de arrepentimiento"
      intro="Si realizaste una compra a distancia, podés iniciar aquí la revocación y recibir un código de comprobante."
    >
      <LegalSection title="Plazo">
        <p>
          La normativa argentina reconoce un plazo de 10 días corridos para
          ejercer el derecho de arrepentimiento en compras a distancia, sujeto
          a las condiciones y excepciones legales aplicables.
        </p>
        <p>
          Podés consultar la{" "}
          <Link
            href="https://www.argentina.gob.ar/justicia/derechofacil/leysimple/boton-arrepentimiento"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-gloria-800 underline"
          >
            guía oficial
          </Link>
          .
        </p>
      </LegalSection>
      <LegalSection title="Iniciar solicitud">
        <p>
          Completá los datos usados en la compra. No necesitás indicar un motivo;
          el comentario es opcional.
        </p>
        <div className="pt-3">
          <WithdrawalForm />
        </div>
      </LegalSection>
    </LegalPage>
  );
}
