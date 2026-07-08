const WHATSAPP_NUMBER = "5493886575936";
const WHATSAPP_MESSAGE =
  "Hola, quiero consultar por una web con diseño, secciones, catálogo, WhatsApp, ubicación, redes y subida a internet.";

export function WhatsAppFloatingButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_MESSAGE
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      className="group fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full border border-[#c7f0d5] bg-[#fffdf9] px-4 py-3 text-[#14532d] shadow-2xl shadow-[#14532d]/18 transition duration-300 hover:-translate-y-1 hover:border-[#25d366] hover:bg-[#ecfdf3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25d366] focus-visible:ring-offset-4 sm:bottom-6 sm:right-6 sm:px-5"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg shadow-[#25d366]/30 transition group-hover:scale-105">
        <svg
          aria-hidden="true"
          viewBox="0 0 32 32"
          className="h-6 w-6 fill-current"
        >
          <path d="M16.02 3.2A12.77 12.77 0 0 0 5.1 22.57L3.4 28.8l6.38-1.67A12.76 12.76 0 1 0 16.02 3.2Zm0 2.31a10.45 10.45 0 1 1-5.32 19.44l-.38-.23-3.79.99 1.01-3.7-.25-.39A10.45 10.45 0 0 1 16.02 5.5Zm-5.13 5.88c-.23 0-.6.09-.91.42-.31.34-1.2 1.18-1.2 2.86s1.23 3.32 1.4 3.55c.17.23 2.37 3.78 5.86 5.15 2.9 1.14 3.49.91 4.12.85.63-.06 2.03-.83 2.32-1.64.29-.8.29-1.49.2-1.64-.08-.14-.31-.23-.66-.4-.34-.17-2.03-1-2.35-1.12-.31-.11-.54-.17-.77.17-.23.34-.89 1.12-1.09 1.35-.2.23-.4.26-.74.09-.34-.17-1.45-.54-2.77-1.71-1.02-.91-1.72-2.04-1.92-2.38-.2-.34-.02-.53.15-.7.16-.15.34-.4.51-.6.17-.2.23-.34.34-.57.11-.23.06-.43-.03-.6-.09-.17-.77-1.86-1.06-2.55-.28-.67-.56-.58-.77-.59h-.65Z" />
        </svg>
      </span>
      <span className="hidden pr-1 text-left sm:block">
        <span className="block text-sm font-black leading-tight">
          Consultar por WhatsApp
        </span>
      </span>
    </a>
  );
}
