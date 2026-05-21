import Link from "next/link";
import Image from "next/image";
import type { StoreSettings } from "@/types";

interface FooterProps {
  settings: StoreSettings;
}

export function Footer({ settings }: FooterProps) {
  return (
    <footer className="bg-[#1a1a1a] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div>
            <Image
              src="/punes-logo.webp"
              alt={settings.store_name}
              width={120}
              height={40}
              className="mb-6 h-10 w-auto brightness-0 invert"
              style={{ width: "auto", height: "40px" }}
            />
            <p className="text-sm leading-relaxed text-white/60">
              {settings.footer_text}
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-[#f6ae66]">Productos</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>
                <Link href="/products?category=colchones" className="transition-colors hover:text-[#f6ae66]">
                  Colchones
                </Link>
              </li>
              <li>
                <Link href="/products?category=sommiers" className="transition-colors hover:text-[#f6ae66]">
                  Sommiers
                </Link>
              </li>
              <li>
                <Link href="/products?category=accesorios" className="transition-colors hover:text-[#f6ae66]">
                  Accesorios
                </Link>
              </li>
              <li>
                <Link href="/products" className="transition-colors hover:text-[#f6ae66]">
                  Ver todos
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-[#f6ae66]">Contacto</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>{settings.address_line}</li>
              <li>
                {settings.city}, {settings.state}
              </li>
              <li>{settings.contact_phone}</li>
              {settings.whatsapp_phone ? <li>WhatsApp: {settings.whatsapp_phone}</li> : null}
              <li>{settings.contact_email}</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-[#f6ae66]">Info</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>{settings.business_hours}</li>
              {settings.instagram_url ? (
                <li>
                  <Link href={settings.instagram_url} className="transition-colors hover:text-[#f6ae66]">
                    Instagram
                  </Link>
                </li>
              ) : null}
              {settings.facebook_url ? (
                <li>
                  <Link href={settings.facebook_url} className="transition-colors hover:text-[#f6ae66]">
                    Facebook
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} {settings.store_name}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
