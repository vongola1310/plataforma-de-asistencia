import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventForm } from "@/components/admin/EventForm";
import { createEvent } from "@/actions/events";

export default function NuevoEventoPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Nuevo evento</h1>
      <Card>
        <CardHeader>
          <CardTitle>Detalles del evento</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm action={createEvent} submitLabel="Crear evento" />
        </CardContent>
      </Card>
    </div>
  );
}
