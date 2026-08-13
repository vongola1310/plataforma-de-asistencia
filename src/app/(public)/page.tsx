import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED", startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-semibold">
        Capacitaciones del Showroom
      </h1>
      <p className="mb-8 text-muted-foreground">
        Consulta las próximas sesiones y regístrate.
      </p>

      <div className="space-y-4">
        {events.map((event) => (
          <Link key={event.id} href={`/eventos/${event.id}`}>
            <Card className="transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {new Intl.DateTimeFormat("es-MX", {
                  dateStyle: "full",
                  timeStyle: "short",
                }).format(event.startsAt)}
                {event.location ? ` · ${event.location}` : ""}
              </CardContent>
            </Card>
          </Link>
        ))}
        {events.length === 0 ? (
          <p className="text-muted-foreground">
            No hay eventos próximos por el momento.
          </p>
        ) : null}
      </div>
    </div>
  );
}
