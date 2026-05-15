import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div>
            <Image
              src="/punes-logo.webp"
              alt="Pune"
              width={120}
              height={40}
              className="mb-6 h-10 w-auto brightness-0 invert"
              style={{ width: "auto", height: "40px" }}
            />
            <p className="text-sm text-white/60 leading-relaxed">
              Más de 30 años fabricando colchones y sommiers con los mejores materiales.
              El descanso que tu familia merece.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-[#f6ae66]">Productos</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>
                <Link href="/products?category=colchones" className="hover:text-[#f6ae66] transition-colors">
                  Colchones
                </Link>
              </li>
              <li>
                <Link href="/products?category=sommiers" className="hover:text-[#f6ae66] transition-colors">
                  Sommiers
                </Link>
              </li>
              <li>
                <Link href="/products?category=accesorios" className="hover:text-[#f6ae66] transition-colors">
                  Accesorios
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-[#f6ae66] transition-colors">
                  Ver todos
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-[#f6ae66]">Contacto</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>Av. Industrial 1234</li>
              <li>Buenos Aires, Argentina</li>
              <li>+54 11 1234-5678</li>
              <li>info@pune.com.ar</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-[#f6ae66]">Horarios</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>Lunes a Viernes: 9:00 - 18:00</li>
              <li>Sábados: 9:00 - 13:00</li>
              <li>Domingos: Cerrado</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Pune Colchones y Sommiers. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}