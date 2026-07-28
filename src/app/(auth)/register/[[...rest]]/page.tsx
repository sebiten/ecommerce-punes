import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Crear cuenta</h1>
          <p className="text-muted-foreground">
            Registrate para acceder a descuentos exclusivos y gestionar tus
            pedidos
          </p>
        </div>
        <SignUp path="/register" routing="path" signInUrl="/login" />
        <p className="text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  );
}
