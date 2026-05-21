"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ACCOUNT_NAV_ITEMS = [
  { href: "/account/orders", label: "Pedidos" },
  { href: "/account/addresses", label: "Direcciones" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b pb-4">
      {ACCOUNT_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-[#f6ae66] text-black"
                : "border hover:bg-accent"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
