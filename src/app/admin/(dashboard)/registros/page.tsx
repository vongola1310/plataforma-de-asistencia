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
import {
  REGISTRATION_FILTERS,
  isRegistrationFilterKey,
  type RegistrationFilterKey,
} from "@/lib/registration-filters";

const STATUS_LABEL: Record<string, string> = {
  REGISTERED: "Registrado",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  ATTENDED: "Asistió",
  WAITLIST: "Lista de espera",
};

const FILTER_KEYS = Object.keys(REGISTRATION_FILTERS) as RegistrationFilterKey[];

export default async function AdminRegistrosPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro } = await searchParams;
  const activeFilter = isRegistrationFilterKey(filtro) ? filtro : undefined;

  const registrations = await prisma.registration.findMany({
    where: activeFilter ? REGISTRATION_FILTERS[activeFilter].where() : {},
    include: { event: true, surveyResponse: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {activeFilter ? REGISTRATION_FILTERS[activeFilter].label : "Todos los registros"}
      </h1>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/registros"
          className={buttonVariants({
            variant: activeFilter ? "outline" : "default",
            size: "sm",
          })}
        >
          Todos
        </Link>
        {FILTER_KEYS.map((key) => (
          <Link
            key={key}
            href={`/admin/registros?filtro=${key}`}
            className={buttonVariants({
              variant: activeFilter === key ? "default" : "outline",
              size: "sm",
            })}
          >
            {REGISTRATION_FILTERS[key].label}
          </Link>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Encuesta</TableHead>
            <TableHead>Constancia</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((registration) => (
            <TableRow key={registration.id}>
              <TableCell>
                <div className="font-medium">{registration.nombreCompleto}</div>
                <div className="text-xs text-muted-foreground">
                  {registration.email}
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/eventos/${registration.eventId}/registros`}
                  className="hover:underline"
                >
                  {registration.event.title}
                </Link>
              </TableCell>
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
              <TableCell className="text-right">
                <Link
                  href={`/admin/registros/${registration.id}`}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Ver
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {registrations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No hay registros que coincidan.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
