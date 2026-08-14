import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegistrationForm } from "@/components/public/RegistrationForm";
import { CapacityNotice } from "@/components/public/CapacityNotice";
import { createRegistration } from "@/actions/registrations";
import { getCapacityInfo } from "@/lib/capacity";

export default async function RegistroEventoPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event || event.status !== "PUBLISHED") notFound();

  const capacity = await getCapacityInfo(prisma, event.id, event.capacity);
  const boundCreateRegistration = createRegistration.bind(null, eventId);

  return (
    <div className="mx-auto max-w-lg px-5 py-14">
      <h1 className="text-4xl font-bold">
        {capacity.isFull ? "Lista de espera" : "Registro"}
      </h1>
      <p className="mb-8 mt-2 text-lg text-muted-foreground">{event.title}</p>

      <CapacityNotice capacity={capacity} />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Datos del asistente</CardTitle>
        </CardHeader>
        <CardContent>
          <RegistrationForm
            action={boundCreateRegistration}
            submitLabel={
              capacity.isFull ? "Anotarme en lista de espera" : "Confirmar registro"
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
