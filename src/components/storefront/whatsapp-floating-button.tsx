import { MessageCircle } from "lucide-react";

export function WhatsAppFloatingButton({
  phone,
  storeName,
}: {
  phone?: string | null;
  storeName: string;
}) {
  if (!phone) return null;

  const href = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hola, quiero consultar por una prenda de ${storeName}.`
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex min-h-12 items-center gap-2 rounded-xl border border-emerald-700/20 bg-emerald-600 px-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-950/20 transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 sm:bottom-6 sm:right-6 sm:px-4"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
