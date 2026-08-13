import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegistrationForm } from "@/components/public/RegistrationForm";
import { createRegistration } from "@/actions/registrations";

export default async function RegistroEventoPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event || event.status !== "PUBLISHED") notFound();

  const boundCreateRegistration = createRegistration.bind(null, eventId);

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-1 text-2xl font-semibold">Registro</h1>
      <p className="mb-6 text-muted-foreground">{event.title}</p>
      <Card>
        <CardHeader>
          <CardTitle>Datos del asistente</CardTitle>
        </CardHeader>
        <CardContent>
          <RegistrationForm action={boundCreateRegistration} />
        </CardContent>
      </Card>
    </div>
  );
}
