"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/hooks/use-cart";
import { isAdmin } from "@/actions/auth";
import { LayoutDashboard, Menu, ReceiptText, Search, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";

export function Header() {
  const { toggleCart, getItemCount } = useCartStore();
  const itemCount = getItemCount();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isUserAdmin, setIsUserAdmin] = React.useState(false);
  const { isSignedIn, isLoaded } = useUser();

  React.useEffect(() => {
    let cancelled = false;

    if (!isLoaded || !isSignedIn) {
      setIsUserAdmin(false);
      return;
    }

    void isAdmin()
      .then((admin) => {
        if (!cancelled) {
          setIsUserAdmin(admin);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsUserAdmin(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-punes.jpg"
              alt="Pune"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className="text-sm font-medium hover:text-[#f6ae66] transition-colors"
            >
              Productos
            </Link>
            <Link
              href="/products?category=colchones"
              className="text-sm font-medium hover:text-[#f6ae66] transition-colors"
            >
              Colchones
            </Link>
            <Link
              href="/products?category=sommiers"
              className="text-sm font-medium hover:text-[#f6ae66] transition-colors"
            >
              Sommiers
            </Link>
            <Link
              href="/products?category=accesorios"
              className="text-sm font-medium hover:text-[#f6ae66] transition-colors"
            >
              Accesorios
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <form action="/products" className="relative hidden lg:flex">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              placeholder="Buscar productos..."
              className="w-56 pl-9 bg-[#f8f4f0] border-0"
            />
          </form>

          {!isLoaded ? (
            <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />
          ) : isSignedIn ? (
            <>
              <div className="hidden items-center gap-2 md:flex">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/account/profile">
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/account/orders">
                    <ReceiptText className="mr-2 h-4 w-4" />
                    Pedidos
                  </Link>
                </Button>
                {isUserAdmin ? (
                  <Button
                    size="sm"
                    className="bg-[#f6ae66] text-black hover:bg-[#f6ae66]/90"
                    asChild
                  >
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                ) : null}
              </div>
              <UserButton />
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-[#f6ae66] hover:text-[#f6ae66] hover:bg-[#f6ae66]/10"
              asChild
            >
              <Link href="/login">
                <User className="h-4 w-4 mr-2" />
                Ingresar
              </Link>
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            className="relative border-[#f6ae66] hover:bg-[#f6ae66]/10"
            onClick={toggleCart}
          >
            <ShoppingBag className="h-5 w-5 text-[#f6ae66]" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#f6ae66] text-xs text-black font-bold">
                {itemCount}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t bg-white md:hidden">
          <div className="container mx-auto px-4 py-4">
            <form action="/products" className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                name="q"
                placeholder="Buscar productos..."
                className="pl-9"
              />
            </form>
            <nav className="flex flex-col gap-4">
              {isSignedIn ? (
                <>
                  <Link
                    href="/account/profile"
                    className="text-sm font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Perfil
                  </Link>
                  <Link
                    href="/account/orders"
                    className="text-sm font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mis pedidos
                  </Link>
                  {isUserAdmin ? (
                    <Link
                      href="/dashboard"
                      className="rounded-md bg-[#f6ae66] px-3 py-2 text-sm font-semibold text-black"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  ) : null}
                </>
              ) : null}
              <Link
                href="/products"
                className="text-sm font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Productos
              </Link>
              <Link
                href="/products?category=colchones"
                className="text-sm font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Colchones
              </Link>
              <Link
                href="/products?category=sommiers"
                className="text-sm font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Sommiers
              </Link>
              <Link
                href="/products?category=accesorios"
                className="text-sm font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Accesorios
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
