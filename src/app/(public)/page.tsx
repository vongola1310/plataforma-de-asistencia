import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EventDateBadge } from "@/components/public/EventDateBadge";

/**
 * Next no puede saber que esta consulta depende de la base, así que sin esto
 * prerenderiza la página en el build y el listado queda congelado: los eventos
 * que publique el admin no aparecerían hasta el siguiente deploy.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await prisma.event.findMany({
    // Se filtra por el fin y no por el inicio para que una sesión en curso siga
    // visible mientras está ocurriendo.
    where: { status: "PUBLISHED", endsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
  });

  return (
    <>
      <section className="brand-glow border-b">
        <div className="mx-auto max-w-4xl px-5 py-20">
          <p className="mb-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            Showroom Euroimmun
          </p>
          <h1 className="max-w-2xl text-5xl font-bold leading-[1.05] sm:text-6xl">
            Capacitaciones para{" "}
            <span className="text-primary">nuestros clientes</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Consulta el temario, los detalles de cada sesión y el croquis de
            nuestras instalaciones. Regístrate en un par de minutos.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-16">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold">Próximas sesiones</h2>
          {events.length > 0 ? (
            <span className="text-sm text-muted-foreground">
              {events.length} {events.length === 1 ? "sesión" : "sesiones"}
            </span>
          ) : null}
        </div>

        <div className="grid gap-4">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/eventos/${event.id}`}
              className="group flex items-center gap-5 rounded-2xl border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <EventDateBadge date={event.startsAt} />
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold transition-colors group-hover:text-primary">
                  {event.title}
                </h3>
                <p className="mt-1 text-muted-foreground">
                  {new Intl.DateTimeFormat("es-MX", {
                    weekday: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(event.startsAt)}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
              </div>
              <span
                aria-hidden
                className="text-2xl text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
              >
                →
              </span>
            </Link>
          ))}

          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center">
              <p className="text-lg font-medium">No hay sesiones programadas</p>
              <p className="mt-1 text-muted-foreground">
                Vuelve pronto para conocer las próximas capacitaciones.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
