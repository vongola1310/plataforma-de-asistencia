import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
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

export default async function AdminEmailsPage() {
  const logs = await prisma.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { registration: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Correos enviados</h1>

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
                Sin correos enviados todavía.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
