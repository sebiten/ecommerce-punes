import Link from "next/link";
import { GloriaMark } from "@/components/brand/gloria-mark";
import { GloriaWordmark } from "@/components/brand/gloria-wordmark";

export function Logo({
  compact = false,
  inverted = false,
  href = "/",
}: {
  compact?: boolean;
  inverted?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Pilchería Gloria, inicio"
      className="inline-flex min-h-11 items-center"
    >
      {compact ? (
        <GloriaMark
          className={`h-11 w-auto ${inverted ? "text-gloria-300" : "text-gloria-700"}`}
        />
      ) : (
        <span className="flex flex-col">
          <span
            className={`mb-0.5 pl-1 text-[0.49rem] font-extrabold uppercase leading-none tracking-[0.36em] ${
              inverted ? "text-gloria-300" : "text-gloria-700"
            }`}
          >
            Pilchería
          </span>
          <GloriaWordmark
            className={`h-[2.15rem] w-auto ${inverted ? "text-white" : "text-gloria-950"}`}
          />
        </span>
      )}
    </Link>
  );
}
