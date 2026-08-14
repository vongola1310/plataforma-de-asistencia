import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BulkCertificateButton } from "@/components/admin/BulkCertificateButton";
import { PromoteWaitlistButton } from "@/components/admin/PromoteWaitlistButton";
import { AccessLinkBox } from "@/components/AccessLinkBox";
import { getCapacityInfo } from "@/lib/capacity";

const STATUS_LABEL: Record<string, string> = {
  REGISTERED: "Registrado",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  ATTENDED: "Asistió",
  WAITLIST: "Lista de espera",
};

export default async function RegistrosEventoPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      registrations: {
        include: { surveyResponse: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const capacity = await getCapacityInfo(prisma, event.id, event.capacity);
  const waitlistCount = event.registrations.filter(
    (r) => r.status === "WAITLIST"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/eventos"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Eventos
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">
          Registros — {event.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {capacity.capacity === null
            ? `${capacity.occupied} registrados · sin límite de cupo`
            : `${capacity.occupied}/${capacity.capacity} lugares ocupados`}
          {waitlistCount > 0 ? ` · ${waitlistCount} en lista de espera` : ""}
        </p>
      </div>

      <BulkCertificateButton eventId={event.id} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Encuesta</TableHead>
            <TableHead>Constancia</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {event.registrations.map((registration) => (
            <TableRow key={registration.id}>
              <TableCell className="font-medium">
                {registration.nombreCompleto}
              </TableCell>
              <TableCell>{registration.email}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {STATUS_LABEL[registration.status]}
                </Badge>
              </TableCell>
              <TableCell>
                {registration.surveyResponse ? "Respondida" : "—"}
              </TableCell>
              <TableCell>
                {registration.certificateSentAt
                  ? "Enviada"
                  : registration.certificateUrl
                    ? "Pendiente de envío"
                    : "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {registration.status === "WAITLIST" ? (
                    <PromoteWaitlistButton registrationId={registration.id} />
                  ) : null}
                  <AccessLinkBox
                    compact
                    url={`${baseUrl}/mi-registro/${registration.accessToken}`}
                  />
                  <Link
                    href={`/admin/registros/${registration.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    Ver
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {event.registrations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Sin registros todavía.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
