import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Configuración general de la tienda
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nombre de la empresa</Label>
            <Input defaultValue="Pune Colchones" />
          </div>
          <div>
            <Label>Email de contacto</Label>
            <Input type="email" defaultValue="info@pune.com.ar" />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input type="tel" defaultValue="+54 11 1234-5678" />
          </div>
          <div>
            <Label>Dirección</Label>
            <Input defaultValue="Av. Industrial 1234, Buenos Aires" />
          </div>
          <Button>Guardar cambios</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redes sociales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Instagram</Label>
            <Input placeholder="https://instagram.com/pune" />
          </div>
          <div>
            <Label>Facebook</Label>
            <Input placeholder="https://facebook.com/pune" />
          </div>
          <Button>Guardar cambios</Button>
        </CardContent>
      </Card>
    </div>
  );
}