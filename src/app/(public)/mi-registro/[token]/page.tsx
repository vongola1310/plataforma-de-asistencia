import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmAttendanceButton } from "@/components/public/ConfirmAttendanceButton";
import { AccessLinkBox } from "@/components/AccessLinkBox";
import { confirmAttendance } from "@/actions/registrations";

const STATUS_LABEL: Record<string, string> = {
  REGISTERED: "Registrado",
  CONFIRMED: "Asistencia confirmada",
  CANCELLED: "Cancelado",
  ATTENDED: "Asististe",
  WAITLIST: "Lista de espera",
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const accessUrl = `${baseUrl}/mi-registro/${token}`;

  const isWaitlisted = registration.status === "WAITLIST";
  const canConfirm =
    registration.status === "REGISTERED" && event.status === "PUBLISHED";
  // Quien está en lista de espera todavía no tiene lugar, así que no recibe
  // los datos de conexión.
  const showWebex =
    registration.status !== "CANCELLED" &&
    !isWaitlisted &&
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

      <div className="mb-6 rounded-md border bg-muted/40 p-4">
        <p className="text-sm font-medium">
          Hola {registration.nombreCompleto}, guarda este link
        </p>
        <p className="mb-3 mt-1 text-sm text-muted-foreground">
          Es tu acceso personal a este evento: con él consultas el temario, el
          croquis y confirmas tu asistencia. Guárdalo en tus favoritos, es la
          única forma de volver a esta página.
        </p>
        <AccessLinkBox url={accessUrl} />
      </div>

      {isWaitlisted ? (
        <div className="mb-6 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-200">
            Estás en lista de espera
          </p>
          <p className="mt-1 text-amber-900/80 dark:text-amber-200/80">
            El cupo de este evento ya está lleno. Guardamos tu lugar en la lista
            de espera y te contactaremos si se libera un espacio. Revisa este
            link: los datos de conexión aparecerán aquí en cuanto tengas lugar.
          </p>
        </div>
      ) : null}

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
