import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const [
    proximosEventos,
    totalConfirmados,
    encuestasPendientes,
    constanciasPendientes,
    correosFallidos,
  ] = await Promise.all([
    prisma.event.count({
      where: { status: "PUBLISHED", startsAt: { gte: new Date() } },
    }),
    prisma.registration.count({ where: { status: "CONFIRMED" } }),
    prisma.registration.count({
      where: {
        surveyResponse: null,
        status: { not: "CANCELLED" },
        event: { endsAt: { lt: new Date() } },
      },
    }),
    prisma.registration.count({
      where: { certificateUrl: { not: null }, certificateSentAt: null },
    }),
    prisma.emailLog.count({ where: { status: "FAILED" } }),
  ]);

  const metrics = [
    { label: "Próximos eventos publicados", value: proximosEventos, href: "/admin/eventos" },
    { label: "Asistencias confirmadas", value: totalConfirmados, href: "/admin/eventos" },
    { label: "Encuestas pendientes", value: encuestasPendientes, href: "/admin/eventos" },
    { label: "Constancias por enviar", value: constanciasPendientes, href: "/admin/eventos" },
    { label: "Correos fallidos", value: correosFallidos, href: "/admin/emails" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <Link key={metric.label} href={metric.href}>
            <Card className="transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle className="text-3xl">{metric.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {metric.label}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
