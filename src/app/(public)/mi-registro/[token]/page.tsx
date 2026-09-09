import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/base-url";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { RegistrationActionButton } from "@/components/public/RegistrationActionButton";
import { AccessLinkBox } from "@/components/AccessLinkBox";
import {
  cancelRegistration,
  confirmAttendance,
  reactivateRegistration,
} from "@/actions/registrations";

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

  const accessUrl = `${await getBaseUrl()}/mi-registro/${token}`;

  const isWaitlisted = registration.status === "WAITLIST";
  const isCancelled = registration.status === "CANCELLED";
  const eventCancelled = event.status === "CANCELLED";
  const eventEnded = event.endsAt < new Date();
  const canConfirm =
    registration.status === "REGISTERED" && event.status === "PUBLISHED";
  // Dar de baja solo tiene sentido mientras la persona ocupa (o espera) un
  // lugar y el evento no ha pasado.
  const canCancel =
    !isCancelled &&
    registration.status !== "ATTENDED" &&
    !eventCancelled &&
    !eventEnded;
  // El par (evento, correo) es único, así que quien canceló no puede volver a
  // llenar el formulario: se reactiva desde aquí, con su propio link.
  const canReactivate = isCancelled && event.status === "PUBLISHED" && !eventEnded;
  // Quien está en lista de espera todavía no tiene lugar, así que no recibe
  // los datos de conexión.
  const showWebex =
    registration.status !== "CANCELLED" &&
    !isWaitlisted &&
    !eventCancelled &&
    event.webexLink;

  return (
    <>
      <section className="brand-glow border-b">
        <div className="mx-auto max-w-2xl px-5 py-12">
          <Badge variant="outline" className="mb-4 bg-background">
            {STATUS_LABEL[registration.status]}
          </Badge>
          <h1 className="text-4xl font-bold leading-tight">{event.title}</h1>
          <p className="mt-3 text-lg">
            {new Intl.DateTimeFormat("es-MX", {
              dateStyle: "full",
              timeStyle: "short",
            }).format(event.startsAt)}
            {event.location ? ` · ${event.location}` : ""}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-5 py-12">
        <div className="mb-8 rounded-2xl border-2 border-primary/25 bg-primary/5 p-5">
          <p className="text-lg font-semibold">
            Hola {registration.nombreCompleto}, guarda este link
          </p>
          <p className="mb-4 mt-1 text-muted-foreground">
            Es tu acceso personal a este evento: con él consultas el temario, el
            croquis y confirmas tu asistencia. Guárdalo en tus favoritos, es la
            única forma de volver a esta página.
          </p>
          <AccessLinkBox url={accessUrl} />
        </div>

      {eventCancelled ? (
        <div className="mb-8 rounded-2xl border border-destructive/30 bg-destructive/10 p-5">
          <p className="text-lg font-semibold text-destructive">
            Este evento fue cancelado
          </p>
          <p className="mt-1 text-destructive/80">
            No es necesario que hagas nada. Si tienes dudas, contáctanos.
          </p>
        </div>
      ) : null}

      {isCancelled ? (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-dashed p-5">
          <div>
            <p className="text-lg font-semibold">Diste de baja tu registro</p>
            <p className="text-muted-foreground">
              {canReactivate
                ? "Si cambiaste de opinión, puedes recuperar tu lugar desde aquí."
                : "El registro ya no está activo para este evento."}
            </p>
          </div>
          {canReactivate ? (
            <RegistrationActionButton
              action={reactivateRegistration.bind(null, token)}
              label="Reactivar mi registro"
              pendingLabel="Reactivando..."
            />
          ) : null}
        </div>
      ) : null}

      {isWaitlisted ? (
        <div className="mb-8 rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 p-5">
          <p className="text-lg font-semibold text-amber-900 dark:text-amber-200">
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
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5">
          <div>
            <p className="text-lg font-semibold">Confirma tu asistencia</p>
            <p className="text-muted-foreground">
              Ayúdanos a preparar el lugar avisándonos que sí vienes.
            </p>
          </div>
          <RegistrationActionButton
            action={confirmAttendance.bind(null, token)}
            label="Confirmar asistencia"
            pendingLabel="Confirmando..."
          />
        </div>
      ) : null}

      {canCancel ? (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5">
          <div>
            <p className="text-lg font-semibold">¿Ya no puedes asistir?</p>
            <p className="text-muted-foreground">
              Da de baja tu lugar para que alguien más de la lista de espera
              pueda tomarlo.
            </p>
          </div>
          <RegistrationActionButton
            action={cancelRegistration.bind(null, token)}
            label="Dar de baja mi registro"
            pendingLabel="Cancelando..."
            variant="outline"
            confirmText="¿Dar de baja tu registro? Tu lugar quedará disponible para alguien más."
          />
        </div>
      ) : null}

      <section className="mb-10">
        <h2 className="mb-3 text-xl">Sobre esta sesión</h2>
        <p className="whitespace-pre-wrap text-lg leading-relaxed text-muted-foreground">
          {event.description}
        </p>
      </section>

      {agenda.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-5 text-xl">Temario</h2>
          <ol className="relative border-l-2 border-primary/20 pl-6">
            {agenda.map((item, i) => (
              <li key={i} className="relative pb-6 last:pb-0">
                <span className="absolute -left-[1.9rem] top-1.5 size-3 rounded-full bg-primary ring-4 ring-background" />
                <p className="text-sm font-semibold text-primary">{item.hora}</p>
                <p className="mt-0.5 text-lg">{item.tema}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {siteSettings?.floorPlanImageUrl ? (
        <section className="mb-10">
          <h2 className="mb-4 text-xl">Croquis del showroom</h2>
          <Image
            src={siteSettings.floorPlanImageUrl}
            alt="Croquis de las instalaciones del showroom"
            width={1000}
            height={700}
            className="h-auto w-full rounded-2xl border"
          />
        </section>
      ) : null}

      {showWebex ? (
        <section className="mb-10 rounded-2xl border-2 border-primary/25 bg-primary/5 p-5">
          <h2 className="mb-3 text-xl">Conexión Webex</h2>
          <a
            href={event.webexLink!}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-medium text-primary underline underline-offset-4"
          >
            {event.webexLink}
          </a>
          {event.webexMeetingNumber || event.webexPassword ? (
            <dl className="mt-4 grid gap-2 sm:grid-cols-2">
              {event.webexMeetingNumber ? (
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Número de reunión
                  </dt>
                  <dd className="font-medium">{event.webexMeetingNumber}</dd>
                </div>
              ) : null}
              {event.webexPassword ? (
                <div>
                  <dt className="text-sm text-muted-foreground">Contraseña</dt>
                  <dd className="font-medium">{event.webexPassword}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </section>
      ) : null}

      {registration.certificateUrl ? (
        <section className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5">
          <div>
            <p className="text-lg font-semibold">Tu constancia está lista</p>
            <p className="text-muted-foreground">
              Gracias por participar en esta capacitación.
            </p>
          </div>
          <a
            href={registration.certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: "lg" })}
          >
            Descargar constancia
          </a>
        </section>
      ) : null}

      {eventEnded && !isCancelled && !isWaitlisted && !registration.surveyResponse ? (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-dashed p-5">
          <div>
            <p className="text-lg font-semibold">¿Cómo te fue?</p>
            <p className="text-muted-foreground">
              Tu opinión nos ayuda a mejorar las próximas sesiones.
            </p>
          </div>
          <Link
            href={`/mi-registro/${token}/encuesta`}
            className={buttonVariants({ size: "lg" })}
          >
            Responder encuesta
          </Link>
        </section>
      ) : null}
      </div>
    </>
  );
}
