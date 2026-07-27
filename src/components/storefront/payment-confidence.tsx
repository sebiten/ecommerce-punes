import Image from "next/image";
import { CreditCard, ShieldCheck } from "lucide-react";
import {
  MERCADO_PAGO_CARD_BRANDS,
  MERCADO_PAGO_PROMO_INSTALLMENTS,
} from "@/lib/payment-options";
import { cn, formatPrice } from "@/lib/utils";

interface PaymentConfidenceProps {
  amount?: number;
  compact?: boolean;
  className?: string;
}

export function PaymentBrandLogos({
  className,
  small = false,
}: {
  className?: string;
  small?: boolean;
}) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      aria-label="Tarjetas aceptadas"
    >
      {MERCADO_PAGO_CARD_BRANDS.map((brand) => (
        <span
          key={brand.name}
          className={cn(
            "flex items-center justify-center rounded-md border border-border/80 bg-white px-2 shadow-sm",
            small ? "h-8 min-w-11" : "h-10 min-w-14"
          )}
          title={brand.name}
        >
          <Image
            src={brand.src}
            alt={brand.name}
            width={brand.width}
            height={brand.height}
            className={cn("w-auto object-contain", small ? "max-h-4" : "max-h-5")}
            unoptimized={brand.src.endsWith(".svg")}
          />
        </span>
      ))}
    </div>
  );
}

export function PaymentConfidence({
  amount,
  compact = false,
  className,
}: PaymentConfidenceProps) {
  const installmentAmount =
    typeof amount === "number" && amount > 0
      ? formatPrice(amount / MERCADO_PAGO_PROMO_INSTALLMENTS)
      : null;
  const title = installmentAmount
    ? `${MERCADO_PAGO_PROMO_INSTALLMENTS} cuotas sin interés de ${installmentAmount}`
    : `Hasta ${MERCADO_PAGO_PROMO_INSTALLMENTS} cuotas sin interés`;

  if (compact) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-gloria-200 bg-gloria-50/70 p-4",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gloria-200 text-gloria-900">
            <CreditCard className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-extrabold leading-5 text-gloria-950">{title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Con tarjetas seleccionadas. El beneficio se confirma en Mercado
              Pago según la tarjeta y el banco emisor.
            </p>
          </div>
        </div>
        <PaymentBrandLogos className="mt-3" small />
      </div>
    );
  }

  return (
    <section
      className={cn("border-b border-border bg-white", className)}
      aria-label="Medios de pago"
    >
      <div className="container mx-auto grid gap-5 px-4 py-6 lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gloria-500 text-gloria-950">
            <CreditCard className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-xl leading-tight text-gloria-950 sm:text-2xl">
              {title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Con tarjetas seleccionadas. También podés pagar con débito o
              dinero disponible en Mercado Pago.
            </p>
          </div>
        </div>

        <PaymentBrandLogos />

        <div className="flex items-center gap-2 border-t border-border pt-4 text-sm font-semibold text-gloria-900 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <ShieldCheck className="size-5 text-gloria-700" aria-hidden="true" />
          Pago protegido por Mercado Pago
        </div>
      </div>
    </section>
  );
}
