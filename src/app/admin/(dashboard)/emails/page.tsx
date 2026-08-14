import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResendEmailButton } from "@/components/admin/ResendEmailButton";

const TYPE_LABEL: Record<string, string> = {
  REGISTRATION_CONFIRMATION: "Confirmación de registro",
  EVENT_REMINDER: "Recordatorio",
  CERTIFICATE_AVAILABLE: "Constancia",
};

const STATUS_VARIANT: Record<string, "outline" | "destructive"> = {
  SENT: "outline",
  PENDING: "outline",
  FAILED: "destructive",
};

const STATUS_FILTERS = [
  { key: undefined, label: "Todos" },
  { key: "SENT", label: "Enviados" },
  { key: "FAILED", label: "Fallidos" },
] as const;

function isEmailStatus(value: string | undefined): value is "SENT" | "FAILED" {
  return value === "SENT" || value === "FAILED";
}

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const activeStatus = isEmailStatus(estado) ? estado : undefined;

  const logs = await prisma.emailLog.findMany({
    where: activeStatus ? { status: activeStatus } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { registration: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {activeStatus === "FAILED"
          ? "Correos fallidos"
          : activeStatus === "SENT"
            ? "Correos enviados"
            : "Registro de correos"}
      </h1>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Link
            key={filter.label}
            href={filter.key ? `/admin/emails?estado=${filter.key}` : "/admin/emails"}
            className={buttonVariants({
              variant: activeStatus === filter.key ? "default" : "outline",
              size: "sm",
            })}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Destinatario</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Detalle</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{log.recipientEmail}</TableCell>
              <TableCell>{TYPE_LABEL[log.type]}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[log.status]}>{log.status}</Badge>
              </TableCell>
              <TableCell>
                {new Intl.DateTimeFormat("es-MX", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(log.createdAt)}
              </TableCell>
              <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                {log.errorMessage ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {log.status === "FAILED" && log.registration ? (
                  <ResendEmailButton logId={log.id} />
                ) : null}
              </TableCell>
            </TableRow>
          ))}
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                {activeStatus
                  ? "No hay correos con este estado."
                  : "Sin correos enviados todavía."}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
