import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CapacityNotice } from "@/components/public/CapacityNotice";
import { getCapacityInfo } from "@/lib/capacity";

export default async function EventoPublicoPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const [event, siteSettings] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
  ]);

  if (!event || event.status === "DRAFT") notFound();

  const capacity = await getCapacityInfo(prisma, event.id, event.capacity);

  const agenda = Array.isArray(event.agenda)
    ? (event.agenda as { hora: string; tema: string }[])
    : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-semibold">{event.title}</h1>
      <p className="mb-6 text-muted-foreground">
        {new Intl.DateTimeFormat("es-MX", {
          dateStyle: "full",
          timeStyle: "short",
        }).format(event.startsAt)}
        {event.location ? ` · ${event.location}` : ""}
      </p>

      {event.status === "CANCELLED" ? (
        <p className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Este evento fue cancelado.
        </p>
      ) : (
        <CapacityNotice capacity={capacity} />
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Detalles</CardTitle>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap text-sm">
          {event.description}
        </CardContent>
      </Card>

      {agenda.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Temario</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {agenda.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-medium">{item.hora}</span>
                  <span>{item.tema}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {siteSettings?.floorPlanImageUrl ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Croquis del showroom</CardTitle>
          </CardHeader>
          <CardContent>
            <Image
              src={siteSettings.floorPlanImageUrl}
              alt="Croquis de instalaciones del showroom"
              width={800}
              height={600}
              className="h-auto w-full rounded-md border"
            />
          </CardContent>
        </Card>
      ) : null}

      {event.status === "PUBLISHED" ? (
        <Link
          href={`/eventos/${event.id}/registro`}
          className={buttonVariants({ size: "lg" })}
        >
          {capacity.isFull
            ? "Anotarme en lista de espera"
            : "Registrarme a este evento"}
        </Link>
      ) : null}
    </div>
  );
}
