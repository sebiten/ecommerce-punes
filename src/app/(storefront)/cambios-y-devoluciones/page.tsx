import type { Metadata } from "next";
import Link from "next/link";
import { getStoreSettings } from "@/actions/store-settings";
import { LegalPage, LegalSection } from "@/components/storefront/legal-page";

export const metadata: Metadata = {
  title: "Cambios y devoluciones",
  description: "Procedimiento para cambios, devoluciones y compras online.",
  alternates: { canonical: "/cambios-y-devoluciones" },
};

export default async function ExchangesPage() {
  const settings = await getStoreSettings();

  return (
    <LegalPage
      eyebrow="Compra con claridad"
      title="Cambios y devoluciones"
      intro="Conservá el comprobante y contactanos antes de acercarte. Así confirmamos stock y evitamos traslados innecesarios."
    >
      <LegalSection title="Cambios comerciales">
        <p>
          Aceptamos cambios dentro de los 30 días corridos desde la entrega,
          con la prenda sin uso, limpia, con etiquetas y en el mismo estado en
          que fue recibida.
        </p>
        <p>
          El cambio queda sujeto al stock disponible. Si existe diferencia de
          precio, se toma el valor vigente al momento del cambio.
        </p>
      </LegalSection>
      <LegalSection title="Cómo solicitarlo">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Enviá el código de pedido, la prenda y el talle que necesitás.</li>
          <li>Esperá nuestra confirmación de disponibilidad.</li>
          <li>
            Coordiná el retiro o acercate a{" "}
            {/completar|confirmar/i.test(settings.address_line)
              ? "la dirección informada al confirmar"
              : settings.address_line}
            .
          </li>
        </ol>
      </LegalSection>
      <LegalSection title="Compras online y fallas">
        <p>
          El derecho de arrepentimiento para compras a distancia se gestiona
          desde el{" "}
          <Link href="/arrepentimiento" className="font-bold text-gloria-800 underline">
            Botón de arrepentimiento
          </Link>
          . Es independiente de nuestra política comercial de cambios.
        </p>
        <p>
          Si recibiste una prenda con falla o distinta a la comprada,
          contactanos apenas la detectes. Tus derechos legales por productos
          defectuosos no se limitan por esta política.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
