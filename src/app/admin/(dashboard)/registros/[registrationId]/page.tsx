import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CertificateForm } from "@/components/admin/CertificateForm";
import { RegistrationStatusActions } from "@/components/admin/RegistrationStatusActions";
import { setCertificateAndNotify } from "@/actions/emails";

const STATUS_LABEL: Record<string, string> = {
  REGISTERED: "Registrado",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  ATTENDED: "Asistió",
  WAITLIST: "Lista de espera",
};

export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ registrationId: string }>;
}) {
  const { registrationId } = await params;

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { event: true, surveyResponse: true },
  });

  if (!registration) notFound();

  const boundSetCertificate = setCertificateAndNotify.bind(null, registrationId);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href={`/admin/eventos/${registration.eventId}/registros`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Registros
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{registration.nombreCompleto}</h1>
          <Badge variant="outline">{STATUS_LABEL[registration.status]}</Badge>
        </div>
      </div>

      {registration.status === "WAITLIST" ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
          Está en lista de espera porque el cupo estaba lleno al registrarse.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 rounded-md border p-4">
        <span className="mr-1 text-sm text-muted-foreground">Acciones:</span>
        <RegistrationStatusActions
          registrationId={registration.id}
          status={registration.status}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del asistente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Evento: {registration.event.title}</p>
          <p>Email: {registration.email}</p>
          <p>Teléfono: {registration.telefono}</p>
          <p>Grado académico: {registration.gradoAcademico}</p>
          <p>Institución: {registration.institucion}</p>
          <p>
            Confirmó asistencia:{" "}
            {registration.confirmedAt
              ? new Intl.DateTimeFormat("es-MX", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(registration.confirmedAt)
              : "No"}
          </p>
        </CardContent>
      </Card>

      {registration.surveyResponse ? (
        <Card>
          <CardHeader>
            <CardTitle>Encuesta de satisfacción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Contenido: {registration.surveyResponse.ratingContent}/5</p>
            <p>Instructor: {registration.surveyResponse.ratingInstructor}/5</p>
            <p>Logística: {registration.surveyResponse.ratingLogistics}/5</p>
            <p>General: {registration.surveyResponse.ratingGeneral}/5</p>
            {registration.surveyResponse.comments ? (
              <p>Comentarios: {registration.surveyResponse.comments}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Constancia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {registration.certificateSentAt ? (
            <p className="text-sm text-muted-foreground">
              Enviada el{" "}
              {new Intl.DateTimeFormat("es-MX", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(registration.certificateSentAt)}
            </p>
          ) : null}
          <CertificateForm
            action={boundSetCertificate}
            defaultUrl={registration.certificateUrl}
          />
        </CardContent>
      </Card>
    </div>
  );
}
