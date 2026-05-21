"use client";

import { useState, useTransition } from "react";
import { updateStoreSettings } from "@/actions/store-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StoreSettings } from "@/types";

interface StoreSettingsFormProps {
  settings: StoreSettings;
}

export function StoreSettingsForm({ settings }: StoreSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    storeName: settings.store_name,
    contactEmail: settings.contact_email,
    contactPhone: settings.contact_phone,
    whatsappPhone: settings.whatsapp_phone || "",
    addressLine: settings.address_line,
    city: settings.city,
    state: settings.state,
    businessHours: settings.business_hours,
    instagramUrl: settings.instagram_url || "",
    facebookUrl: settings.facebook_url || "",
    footerText: settings.footer_text,
    standardShippingCost: String(settings.standard_shipping_cost),
    expressShippingCost: String(settings.express_shipping_cost),
    freeShippingThreshold: String(settings.free_shipping_threshold),
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await updateStoreSettings({
          storeName: formData.storeName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          whatsappPhone: formData.whatsappPhone,
          addressLine: formData.addressLine,
          city: formData.city,
          state: formData.state,
          businessHours: formData.businessHours,
          instagramUrl: formData.instagramUrl,
          facebookUrl: formData.facebookUrl,
          footerText: formData.footerText,
          standardShippingCost: Number(formData.standardShippingCost),
          expressShippingCost: Number(formData.expressShippingCost),
          freeShippingThreshold: Number(formData.freeShippingThreshold),
        });
        setSuccess("Configuracion guardada.");
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "No se pudo guardar la configuracion"
        );
      }
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Informacion del negocio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="storeName">Nombre comercial</Label>
            <Input id="storeName" name="storeName" value={formData.storeName} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="contactEmail">Email de contacto</Label>
            <Input id="contactEmail" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="contactPhone">Telefono</Label>
            <Input id="contactPhone" name="contactPhone" value={formData.contactPhone} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="whatsappPhone">WhatsApp</Label>
            <Input id="whatsappPhone" name="whatsappPhone" value={formData.whatsappPhone} onChange={handleChange} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="addressLine">Direccion</Label>
            <Input id="addressLine" name="addressLine" value={formData.addressLine} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" name="city" value={formData.city} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="state">Provincia / Pais</Label>
            <Input id="state" name="state" value={formData.state} onChange={handleChange} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="businessHours">Horarios</Label>
            <Input id="businessHours" name="businessHours" value={formData.businessHours} onChange={handleChange} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="footerText">Texto del footer</Label>
            <Input id="footerText" name="footerText" value={formData.footerText} onChange={handleChange} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redes sociales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="instagramUrl">Instagram</Label>
            <Input id="instagramUrl" name="instagramUrl" value={formData.instagramUrl} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="facebookUrl">Facebook</Label>
            <Input id="facebookUrl" name="facebookUrl" value={formData.facebookUrl} onChange={handleChange} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Envios</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="standardShippingCost">Envio estandar</Label>
            <Input id="standardShippingCost" name="standardShippingCost" type="number" min="0" value={formData.standardShippingCost} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="expressShippingCost">Envio express</Label>
            <Input id="expressShippingCost" name="expressShippingCost" type="number" min="0" value={formData.expressShippingCost} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="freeShippingThreshold">Umbral envio gratis</Label>
            <Input id="freeShippingThreshold" name="freeShippingThreshold" type="number" min="0" value={formData.freeShippingThreshold} onChange={handleChange} />
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">{success}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
