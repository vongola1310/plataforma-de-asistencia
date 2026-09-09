import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toDatetimeLocal } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventForm } from "@/components/admin/EventForm";
import { updateEvent } from "@/actions/events";

export default async function EditarEventoPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ creado?: string }>;
}) {
  const { eventId } = await params;
  const { creado } = await searchParams;
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) notFound();

  const agenda = Array.isArray(event.agenda)
    ? (event.agenda as { hora: string; tema: string }[])
    : [];

  const boundUpdateEvent = updateEvent.bind(null, eventId);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Editar evento</h1>

      {creado ? (
        <p
          role="status"
          className="mb-6 rounded-md border border-primary/30 bg-primary/10 p-4 text-sm font-medium text-primary"
        >
          Evento creado. {event.status === "PUBLISHED"
            ? "Ya es visible en la página pública."
            : "Sigue en borrador: cambia el estado a “Publicado” para que aparezca en la página pública."}
        </p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            action={boundUpdateEvent}
            submitLabel="Guardar cambios"
            defaultValues={{
              title: event.title,
              description: event.description,
              location: event.location ?? "",
              startsAt: toDatetimeLocal(event.startsAt),
              endsAt: toDatetimeLocal(event.endsAt),
              capacity: event.capacity ? String(event.capacity) : "",
              webexLink: event.webexLink ?? "",
              webexPassword: event.webexPassword ?? "",
              webexMeetingNumber: event.webexMeetingNumber ?? "",
              agenda,
              status: event.status,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
