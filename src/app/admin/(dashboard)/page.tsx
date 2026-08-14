import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REGISTRATION_FILTERS } from "@/lib/registration-filters";

export default async function AdminDashboardPage() {
  const [
    proximosEventos,
    totalConfirmados,
    encuestasPendientes,
    constanciasPendientes,
    correosFallidos,
    enListaEspera,
  ] = await Promise.all([
    prisma.event.count({
      where: { status: "PUBLISHED", startsAt: { gte: new Date() } },
    }),
    prisma.registration.count({
      where: REGISTRATION_FILTERS.confirmados.where(),
    }),
    prisma.registration.count({
      where: REGISTRATION_FILTERS["encuesta-pendiente"].where(),
    }),
    prisma.registration.count({
      where: REGISTRATION_FILTERS["constancia-pendiente"].where(),
    }),
    prisma.emailLog.count({ where: { status: "FAILED" } }),
    prisma.registration.count({
      where: REGISTRATION_FILTERS["lista-espera"].where(),
    }),
  ]);

  const metrics = [
    {
      label: "Próximos eventos publicados",
      value: proximosEventos,
      href: "/admin/eventos",
    },
    {
      label: REGISTRATION_FILTERS.confirmados.label,
      value: totalConfirmados,
      href: "/admin/registros?filtro=confirmados",
    },
    {
      label: REGISTRATION_FILTERS["encuesta-pendiente"].label,
      value: encuestasPendientes,
      href: "/admin/registros?filtro=encuesta-pendiente",
    },
    {
      label: REGISTRATION_FILTERS["constancia-pendiente"].label,
      value: constanciasPendientes,
      href: "/admin/registros?filtro=constancia-pendiente",
    },
    {
      label: REGISTRATION_FILTERS["lista-espera"].label,
      value: enListaEspera,
      href: "/admin/registros?filtro=lista-espera",
    },
    {
      label: "Correos fallidos",
      value: correosFallidos,
      href: "/admin/emails?estado=FAILED",
    },
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
