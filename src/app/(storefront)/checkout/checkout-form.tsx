"use client";

import { useState } from "react";
import { addAddress, updateProfileContact } from "@/actions/auth";
import { useCartStore } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  getCartItemLineTotal,
  getShippingCost,
} from "@/lib/commerce";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { Address, Profile, StoreSettings } from "@/types";

interface CheckoutFormProps {
  addresses: Address[];
  profile: Profile | null;
  settings: StoreSettings;
}

function splitFullName(fullName: string | null | undefined) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);

  return {
    name: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function getDefaultAddress(addresses: Address[]) {
  return addresses.find((address) => address.is_default) || addresses[0] || null;
}

export function CheckoutForm({ addresses, profile, settings }: CheckoutFormProps) {
  const formId = "checkout-form";
  const router = useRouter();
  const { items, getTotal } = useCartStore();
  const isSignedIn = Boolean(profile);
  const defaultAddress = getDefaultAddress(addresses);
  const defaultName = splitFullName(defaultAddress?.name || profile?.full_name);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddress?.id || "manual"
  );
  const [saveAddress, setSaveAddress] = useState(addresses.length === 0);
  const [saveAsDefault, setSaveAsDefault] = useState(addresses.length === 0);
  const [formData, setFormData] = useState({
    name: defaultName.name,
    lastName: defaultName.lastName,
    email: profile?.email || "",
    phone: profile?.phone || "",
    street: defaultAddress?.street || "",
    city: defaultAddress?.city || "",
    state: defaultAddress?.state || "",
    zip: defaultAddress?.zip || "",
    shippingMethod: "standard",
    couponCode: "",
  });

  const subtotal = getTotal();
  const shippingCost = getShippingCost(subtotal, formData.shippingMethod, {
    standardShippingCost: settings.standard_shipping_cost,
    expressShippingCost: settings.express_shipping_cost,
    freeShippingThreshold: settings.free_shipping_threshold,
  });
  const total = subtotal + shippingCost;
  const shouldOfferSaveAddress = isSignedIn && selectedAddressId === "manual";

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleAddressSelect = (value: string) => {
    setSelectedAddressId(value);
    setError(null);

    if (value === "manual") {
      return;
    }

    const address = addresses.find((item) => item.id === value);
    if (!address) {
      return;
    }

    const recipient = splitFullName(address.name || profile?.full_name);
    setFormData((current) => ({
      ...current,
      name: recipient.name,
      lastName: recipient.lastName,
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip || "",
      email: current.email || profile?.email || "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      const fullName = `${formData.name} ${formData.lastName}`.trim();

      if (
        isSignedIn &&
        (formData.phone.trim() !== (profile?.phone || "") ||
          fullName !== (profile?.full_name || "").trim())
      ) {
        await updateProfileContact({
          fullName,
          phone: formData.phone,
        });
      }

      if (shouldOfferSaveAddress && saveAddress) {
        await addAddress({
          name: fullName,
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zip: formData.zip.trim() || undefined,
          isDefault: saveAsDefault || addresses.length === 0,
        });
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          total,
          shippingCost,
          shippingMethod: formData.shippingMethod,
          couponCode: formData.couponCode.trim() || undefined,
          shippingAddress: {
            name: fullName,
            email: formData.email,
            phone: formData.phone,
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo iniciar el checkout");
      }

      if (data.preference?.init_point) {
        window.location.href = data.preference.init_point;
        return;
      }

      throw new Error("No se pudo generar la preferencia de pago");
    } catch (submitError) {
      console.error("Checkout error:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo procesar el checkout"
      );
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">Tu carrito esta vacio</h1>
        <Button onClick={() => router.push("/products")}>Ver productos</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Finalizar compra</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form id={formId} data-testid="checkout-form" onSubmit={handleSubmit}>
            {addresses.length > 0 ? (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Direccion guardada</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedAddressId}
                    onValueChange={handleAddressSelect}
                    className="space-y-3"
                  >
                    {addresses.map((address) => (
                      <div key={address.id}>
                        <RadioGroupItem
                          value={address.id}
                          id={`address-${address.id}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`address-${address.id}`}
                          className="flex cursor-pointer flex-col rounded-lg border p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <span className="font-medium">{address.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {address.street}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {address.city}, {address.state}
                            {address.zip ? `, ${address.zip}` : ""}
                          </span>
                        </Label>
                      </div>
                    ))}

                    <div>
                      <RadioGroupItem
                        value="manual"
                        id="address-manual"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="address-manual"
                        className="flex cursor-pointer rounded-lg border border-dashed p-4 text-sm peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        Cargar una direccion manualmente
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            ) : null}

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Datos de contacto</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Direccion de envio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="street">Calle y numero</Label>
                  <Input
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Provincia</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="zip">Codigo postal</Label>
                  <Input
                    id="zip"
                    name="zip"
                    value={formData.zip}
                    onChange={handleInputChange}
                  />
                </div>

                {shouldOfferSaveAddress ? (
                  <div className="space-y-3 rounded-lg border border-dashed p-4">
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(event) => setSaveAddress(event.target.checked)}
                      />
                      Guardar esta direccion para futuras compras
                    </label>

                    {saveAddress ? (
                      <label className="flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={saveAsDefault}
                          onChange={(event) => setSaveAsDefault(event.target.checked)}
                        />
                        Marcar como direccion predeterminada
                      </label>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metodo de envio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <label className="flex cursor-pointer items-center justify-between rounded-lg border p-4 hover:bg-accent">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="standard"
                      checked={formData.shippingMethod === "standard"}
                      onChange={handleInputChange}
                    />
                    <div>
                      <p className="font-medium">Envío estándar</p>
                      <p className="text-sm text-muted-foreground">
                        Entrega en 5-7 días hábiles
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold">
                    {subtotal >= settings.free_shipping_threshold
                      ? "Gratis"
                      : formatPrice(settings.standard_shipping_cost)}
                  </span>
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-lg border p-4 hover:bg-accent">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="express"
                      checked={formData.shippingMethod === "express"}
                      onChange={handleInputChange}
                    />
                    <div>
                      <p className="font-medium">Envío express</p>
                      <p className="text-sm text-muted-foreground">
                        Entrega en 24-48 horas
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold">
                    {formatPrice(settings.express_shipping_cost)}
                  </span>
                </label>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Cupon de descuento</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="couponCode">Codigo</Label>
                <Input
                  id="couponCode"
                  name="couponCode"
                  value={formData.couponCode}
                  onChange={handleInputChange}
                  placeholder="BIENVENIDO10"
                />
              </CardContent>
            </Card>

            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          </form>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Resumen del pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={`${item.product_id}-${item.variant_id}`}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {item.product?.name} x {item.quantity}
                    </span>
                    <span>{formatPrice(getCartItemLineTotal(item))}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Envío</span>
                  <span>
                    {shippingCost === 0 ? "Gratis" : formatPrice(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                type="submit"
                form={formId}
                data-testid="checkout-submit"
                disabled={isProcessing}
              >
                {isProcessing ? "Procesando..." : "Confirmar y pagar"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
