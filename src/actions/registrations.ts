"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateAccessToken } from "@/lib/tokens";
import { registrationSchema } from "@/lib/validations/registration.schema";
import { Prisma } from "@/generated/prisma/client";
import { sendRegistrationConfirmationEmail } from "@/lib/email-templates";
import { getCapacityInfo } from "@/lib/capacity";
import { auth } from "@/lib/auth";

export type RegistrationFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createRegistration(
  eventId: string,
  _prevState: RegistrationFormState,
  formData: FormData
): Promise<RegistrationFormState> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event || event.status !== "PUBLISHED") {
    return { error: "Este evento ya no está disponible para registro." };
  }

  const parsed = registrationSchema.safeParse({
    gradoAcademico: formData.get("gradoAcademico"),
    nombreCompleto: formData.get("nombreCompleto"),
    email: formData.get("email"),
    telefono: formData.get("telefono"),
    institucion: formData.get("institucion"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  let accessToken: string;

  try {
    const registration = await prisma.$transaction(async (tx) => {
      // Bloquea la fila del evento para serializar los registros concurrentes:
      // sin esto, dos personas enviando el formulario a la vez podrían tomar
      // ambas el último lugar y sobrepasar el cupo.
      await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`;

      const { isFull } = await getCapacityInfo(tx, eventId, event.capacity);

      return tx.registration.create({
        data: {
          eventId,
          gradoAcademico: data.gradoAcademico,
          nombreCompleto: data.nombreCompleto,
          email: data.email,
          telefono: data.telefono,
          institucion: data.institucion,
          accessToken: generateAccessToken(),
          status: isFull ? "WAITLIST" : "REGISTERED",
        },
      });
    });

    accessToken = registration.accessToken;

    try {
      await sendRegistrationConfirmationEmail(registration, event);
    } catch (emailError) {
      // No bloqueamos el registro si falla el envío del correo; queda registrado el intento en EmailLog cuando es posible.
      console.error("Error enviando correo de confirmación:", emailError);
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.registration.findUnique({
        where: { eventId_email: { eventId, email: data.email } },
      });
      if (!existing) throw error;
      accessToken = existing.accessToken;
    } else {
      throw error;
    }
  }

  revalidatePath(`/admin/eventos/${eventId}/registros`);
  redirect(`/mi-registro/${accessToken}`);
}

/**
 * Promueve a un asistente de lista de espera a registrado (admin).
 * Vuelve a validar el cupo bajo lock para no sobrepasarlo.
 */
export async function promoteFromWaitlist(
  registrationId: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autorizado" };

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { event: true },
  });

  if (!registration) return { ok: false, error: "Registro no encontrado" };
  if (registration.status !== "WAITLIST") {
    return { ok: false, error: "Este registro no está en lista de espera" };
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${registration.eventId} FOR UPDATE`;

    const { isFull } = await getCapacityInfo(
      tx,
      registration.eventId,
      registration.event.capacity
    );

    if (isFull) {
      return { ok: false, error: "No hay lugares disponibles" };
    }

    await tx.registration.update({
      where: { id: registrationId },
      data: { status: "REGISTERED" },
    });

    return { ok: true };
  });

  if (result.ok) {
    revalidatePath(`/admin/eventos/${registration.eventId}/registros`);
    revalidatePath(`/admin/registros/${registrationId}`);
    revalidatePath(`/mi-registro/${registration.accessToken}`);
  }

  return result;
}

export async function confirmAttendance(token: string) {
  const registration = await prisma.registration.findUnique({
    where: { accessToken: token },
  });

  // Solo quien ya tiene lugar puede confirmar. Los de lista de espera no
  // pueden auto-promoverse llamando a esta acción directamente.
  if (
    !registration ||
    (registration.status !== "REGISTERED" && registration.status !== "CONFIRMED")
  ) {
    return;
  }

  await prisma.registration.update({
    where: { accessToken: token },
    data: {
      status: "CONFIRMED",
      confirmedAt: registration.confirmedAt ?? new Date(),
    },
  });

  revalidatePath(`/mi-registro/${token}`);
  revalidatePath(`/admin/eventos/${registration.eventId}/registros`);
}
