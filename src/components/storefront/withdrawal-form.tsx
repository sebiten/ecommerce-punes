"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { createWithdrawalRequest } from "@/actions/withdrawal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WithdrawalForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [requestCode, setRequestCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    orderReference: "",
    email: "",
    phone: "",
    reason: "",
    website: "",
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const result = await createWithdrawalRequest(formData);
        setRequestCode(result.requestCode);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "No se pudo registrar la solicitud"
        );
      }
    });
  };

  if (requestCode) {
    return (
      <div className="rounded-2xl border border-green-300 bg-green-50 p-6 text-green-950">
        <CheckCircle2 className="size-7" />
        <h2 className="mt-3 text-xl font-bold">Solicitud registrada</h2>
        <p className="mt-2 text-sm leading-6">
          Tu código de comprobante es{" "}
          <strong className="font-mono">{requestCode}</strong>. Guardalo para
          cualquier consulta.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField
        label="Número o código de pedido"
        name="orderReference"
        value={formData.orderReference}
        onChange={(event) =>
          setFormData((current) => ({
            ...current,
            orderReference: event.target.value,
          }))
        }
        required
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Email usado en la compra"
          name="email"
          type="email"
          value={formData.email}
          onChange={(event) =>
            setFormData((current) => ({ ...current, email: event.target.value }))
          }
          required
        />
        <FormField
          label="Teléfono"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={(event) =>
            setFormData((current) => ({ ...current, phone: event.target.value }))
          }
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reason">Comentario opcional</Label>
        <textarea
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={(event) =>
            setFormData((current) => ({ ...current, reason: event.target.value }))
          }
          className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          maxLength={1000}
        />
      </div>
      <div className="sr-only" aria-hidden="true">
        <Label htmlFor="website">Sitio web</Label>
        <Input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website}
          onChange={(event) =>
            setFormData((current) => ({ ...current, website: event.target.value }))
          }
        />
      </div>
      {error ? (
        <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending} className="min-h-12 w-full sm:w-auto">
        {isPending ? "Registrando..." : "Enviar solicitud"}
      </Button>
    </form>
  );
}

function FormField({
  label,
  name,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; name: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} className="min-h-11" {...props} />
    </div>
  );
}
