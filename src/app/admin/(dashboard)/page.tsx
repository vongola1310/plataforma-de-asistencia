import Link from "next/link";
import { prisma } from "@/lib/prisma";
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
      <h1 className="mb-1 text-3xl font-bold">Dashboard</h1>
      <p className="mb-8 text-muted-foreground">
        Resumen de eventos, registros y correos.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="group rounded-2xl border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
          >
            <span
              className={`block text-4xl font-bold tabular-nums ${
                metric.value > 0 ? "text-primary" : "text-muted-foreground/40"
              }`}
            >
              {metric.value}
            </span>
            <span className="mt-2 block font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              {metric.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
