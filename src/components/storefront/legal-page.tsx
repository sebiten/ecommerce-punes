import Link from "next/link";

export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="bg-gloria-50/45">
      <section className="border-b border-gloria-200 bg-white">
        <div className="container mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gloria-700">
            {eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-gloria-950 sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            {intro}
          </p>
        </div>
      </section>
      <div className="container mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1fr_15rem]">
        <article className="space-y-8 rounded-3xl border border-gloria-200 bg-white p-6 shadow-sm sm:p-9">
          {children}
        </article>
        <aside className="h-fit rounded-2xl border border-gloria-200 bg-white p-5 text-sm lg:sticky lg:top-24">
          <p className="font-bold text-gloria-950">Ayuda y legales</p>
          <nav className="mt-4 flex flex-col gap-3 text-muted-foreground">
            <Link href="/cambios-y-devoluciones" className="hover:text-gloria-800">Cambios y devoluciones</Link>
            <Link href="/terminos" className="hover:text-gloria-800">Términos de compra</Link>
            <Link href="/privacidad" className="hover:text-gloria-800">Privacidad</Link>
            <Link href="/arrepentimiento" className="font-bold text-gloria-800">Botón de arrepentimiento</Link>
          </nav>
        </aside>
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl text-gloria-950">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
