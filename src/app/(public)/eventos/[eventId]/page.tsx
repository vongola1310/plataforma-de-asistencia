import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { CapacityNotice } from "@/components/public/CapacityNotice";
import { getCapacityInfo } from "@/lib/capacity";

export default async function EventoPublicoPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const [event, siteSettings] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
  ]);

  if (!event || event.status === "DRAFT") notFound();

  const capacity = await getCapacityInfo(prisma, event.id, event.capacity);

  const agenda = Array.isArray(event.agenda)
    ? (event.agenda as { hora: string; tema: string }[])
    : [];

  return (
    <>
      <section className="brand-glow border-b">
        <div className="mx-auto max-w-3xl px-5 py-14">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ← Todas las sesiones
          </Link>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
            {event.title}
          </h1>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-base">
            <span className="font-medium">
              {new Intl.DateTimeFormat("es-MX", {
                dateStyle: "full",
                timeStyle: "short",
              }).format(event.startsAt)}
            </span>
            {event.location ? (
              <span className="text-muted-foreground">{event.location}</span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5 py-12">
        {event.status === "CANCELLED" ? (
          <p className="mb-8 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            Este evento fue cancelado.
          </p>
        ) : (
          <CapacityNotice capacity={capacity} />
        )}

        <section className="mb-10">
          <h2 className="mb-3 text-xl">Sobre esta sesión</h2>
          <p className="whitespace-pre-wrap text-lg leading-relaxed text-muted-foreground">
            {event.description}
          </p>
        </section>

        {agenda.length > 0 ? (
          <section className="mb-10">
            <h2 className="mb-5 text-xl">Temario</h2>
            <ol className="relative space-y-0 border-l-2 border-primary/20 pl-6">
              {agenda.map((item, i) => (
                <li key={i} className="relative pb-6 last:pb-0">
                  <span className="absolute -left-[1.9rem] top-1.5 size-3 rounded-full bg-primary ring-4 ring-background" />
                  <p className="text-sm font-semibold text-primary">
                    {item.hora}
                  </p>
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
              alt="Croquis de instalaciones del showroom"
              width={1000}
              height={700}
              className="h-auto w-full rounded-2xl border"
            />
          </section>
        ) : null}

        {event.status === "PUBLISHED" ? (
          <div className="sticky bottom-6 rounded-2xl border bg-card/95 p-5 shadow-lg backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">
                  {capacity.isFull ? "Cupo lleno" : "¿Te interesa asistir?"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {capacity.isFull
                    ? "Puedes anotarte en la lista de espera."
                    : "El registro toma menos de dos minutos."}
                </p>
              </div>
              <Link
                href={`/eventos/${event.id}/registro`}
                className={buttonVariants({ size: "lg" })}
              >
                {capacity.isFull
                  ? "Anotarme en lista de espera"
                  : "Registrarme"}
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
