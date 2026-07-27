import type { Metadata } from "next";
import { getStoreSettings } from "@/actions/store-settings";
import { LegalPage, LegalSection } from "@/components/storefront/legal-page";

export const metadata: Metadata = {
  title: "Términos de compra",
  description: "Condiciones de compra, pago, stock, retiro y entrega.",
  alternates: { canonical: "/terminos" },
};

export default async function TermsPage() {
  const settings = await getStoreSettings();
  const legalReady = Boolean(
    settings.legal_name && settings.tax_id && settings.legal_address
  );

  return (
    <LegalPage
      eyebrow="Información contractual"
      title="Términos de compra"
      intro="Estas condiciones explican cómo se confirma una compra, cuándo se reserva el stock y cómo coordinamos la entrega."
    >
      {!legalReady ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
          <strong>Publicación pendiente:</strong> el responsable debe completar
          razón social, CUIT y domicilio legal en Configuración antes de vender.
        </div>
      ) : null}
      <LegalSection title="Proveedor">
        <p>Nombre o razón social: {settings.legal_name || "Pendiente de completar"}.</p>
        <p>CUIT: {settings.tax_id || "Pendiente de completar"}.</p>
        <p>Domicilio legal: {settings.legal_address || "Pendiente de completar"}.</p>
        <p>Email de contacto: {settings.contact_email}.</p>
      </LegalSection>
      <LegalSection title="Compra y disponibilidad">
        <p>
          Los precios se expresan en pesos argentinos. La compra queda
          confirmada cuando Mercado Pago informa el pago aprobado.
        </p>
        <p>
          Al iniciar el pago reservamos el stock durante 30 minutos. Si no se
          registra un pago, la orden se cancela y las unidades vuelven al
          catálogo.
        </p>
        <p>
          Ante una diferencia excepcional de stock luego de un pago,
          contactaremos al comprador para resolver el pedido o reintegrar el
          importe.
        </p>
      </LegalSection>
      <LegalSection title="Retiro y entrega">
        <p>
          No te acerques hasta recibir la confirmación de que el pedido está
          listo. {settings.pickup_instructions}
        </p>
        <p>
          Si se habilita entrega local, el costo y los datos necesarios se
          informan antes de pagar.
        </p>
      </LegalSection>
      <LegalSection title="Cambios y cancelación">
        <p>
          Las condiciones de cambios están disponibles en la sección Cambios y
          devoluciones. Las compras online cuentan además con el Botón de
          arrepentimiento.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
