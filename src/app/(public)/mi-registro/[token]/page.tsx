import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmAttendanceButton } from "@/components/public/ConfirmAttendanceButton";
import { confirmAttendance } from "@/actions/registrations";

const STATUS_LABEL: Record<string, string> = {
  REGISTERED: "Registrado",
  CONFIRMED: "Asistencia confirmada",
  CANCELLED: "Cancelado",
  ATTENDED: "Asististe",
};

export default async function MiRegistroPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const registration = await prisma.registration.findUnique({
    where: { accessToken: token },
    include: { event: true, surveyResponse: true },
  });

  if (!registration) notFound();

  const { event } = registration;
  const agenda = Array.isArray(event.agenda)
    ? (event.agenda as { hora: string; tema: string }[])
    : [];
  const siteSettings = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  const canConfirm =
    registration.status === "REGISTERED" && event.status === "PUBLISHED";
  const showWebex =
    registration.status !== "CANCELLED" &&
    event.status !== "CANCELLED" &&
    event.webexLink;
  const eventEnded = event.endsAt < new Date();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{event.title}</h1>
        <Badge variant="outline">{STATUS_LABEL[registration.status]}</Badge>
      </div>

      <p className="mb-6 text-muted-foreground">
        {new Intl.DateTimeFormat("es-MX", {
          dateStyle: "full",
          timeStyle: "short",
        }).format(event.startsAt)}
        {event.location ? ` · ${event.location}` : ""}
      </p>

      <p className="mb-6 text-sm">
        Hola {registration.nombreCompleto}, este es tu acceso personal a este
        evento. Guarda este link.
      </p>

      {canConfirm ? (
        <div className="mb-6">
          <ConfirmAttendanceButton action={confirmAttendance.bind(null, token)} />
        </div>
      ) : null}

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

      {showWebex ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conexión Webex</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <a
                href={event.webexLink!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {event.webexLink}
              </a>
            </p>
            {event.webexMeetingNumber ? (
              <p>Número de reunión: {event.webexMeetingNumber}</p>
            ) : null}
            {event.webexPassword ? (
              <p>Contraseña: {event.webexPassword}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {registration.certificateUrl ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Constancia</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={registration.certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              Descargar constancia
            </a>
          </CardContent>
        </Card>
      ) : null}

      {eventEnded && !registration.surveyResponse ? (
        <Link
          href={`/mi-registro/${token}/encuesta`}
          className={buttonVariants()}
        >
          Responder encuesta de satisfacción
        </Link>
      ) : null}
    </div>
  );
}
