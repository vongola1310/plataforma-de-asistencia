"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateAccessToken } from "@/lib/tokens";
import { registrationSchema } from "@/lib/validations/registration.schema";
import { Prisma } from "@/generated/prisma/client";
import {
  sendRegistrationConfirmationEmail,
  sendWaitlistPromotedEmail,
} from "@/lib/email-templates";
import { isEmailConfigured } from "@/lib/resend";
import { getCapacityInfo } from "@/lib/capacity";
import { auth } from "@/lib/auth";

export type RegistrationFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Bloquea la fila del evento para serializar los registros concurrentes: sin
 * esto, dos personas enviando el formulario a la vez podrían tomar ambas el
 * último lugar y sobrepasar el cupo. La capacidad se relee bajo el lock para no
 * decidir con un valor que el admin pudo haber cambiado mientras tanto.
 */
async function lockEventAndReadCapacity(
  tx: Prisma.TransactionClient,
  eventId: string
) {
  await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`;
  const locked = await tx.event.findUnique({
    where: { id: eventId },
    select: { capacity: true },
  });
  return getCapacityInfo(tx, eventId, locked?.capacity ?? null);
}

function revalidateEventViews(eventId: string) {
  revalidatePath(`/admin/eventos/${eventId}/registros`);
  revalidatePath(`/eventos/${eventId}`);
  revalidatePath(`/eventos/${eventId}/registro`);
}

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
  let registration;

  try {
    registration = await prisma.$transaction(async (tx) => {
      const { isFull } = await lockEventAndReadCapacity(tx, eventId);

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
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: await resendAccessLink(eventId, data.email) };
    }
    throw error;
  }

  try {
    await sendRegistrationConfirmationEmail(registration, event);
  } catch (emailError) {
    // No bloqueamos el registro si falla el envío del correo; queda registrado el intento en EmailLog cuando es posible.
    console.error("Error enviando correo de confirmación:", emailError);
  }

  revalidateEventViews(eventId);
  redirect(`/mi-registro/${registration.accessToken}`);
}

/**
 * Un correo ya registrado NO puede llevar a la página de ese registro: el
 * formulario es público, así que redirigir ahí entregaría los datos personales
 * y el token de acceso de otra persona a quien solo adivinó su correo. El link
 * siempre se entrega por correo, al dueño de la dirección.
 */
async function resendAccessLink(eventId: string, email: string): Promise<string> {
  const existing = await prisma.registration.findUnique({
    where: { eventId_email: { eventId, email } },
    include: { event: true },
  });

  if (!existing) {
    return "No pudimos completar tu registro. Vuelve a intentarlo.";
  }

  if (!isEmailConfigured()) {
    return "Ya hay un registro con este correo para este evento. Contáctanos para recuperar tu link de acceso.";
  }

  try {
    await sendRegistrationConfirmationEmail(existing, existing.event);
  } catch (error) {
    console.error("Error reenviando el link de acceso:", error);
  }

  return "Ya hay un registro con este correo para este evento. Te reenviamos tu link de acceso a esa dirección.";
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
    const { isFull } = await lockEventAndReadCapacity(tx, registration.eventId);

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
    // El correo de confirmación promete avisar en cuanto se libere un lugar.
    try {
      await sendWaitlistPromotedEmail(
        { ...registration, status: "REGISTERED" },
        registration.event
      );
    } catch (error) {
      console.error("Error avisando la promoción de lista de espera:", error);
    }

    revalidateEventViews(registration.eventId);
    revalidatePath(`/admin/registros/${registrationId}`);
    revalidatePath(`/mi-registro/${registration.accessToken}`);
  }

  return result;
}

export async function confirmAttendance(token: string) {
  const registration = await prisma.registration.findUnique({
    where: { accessToken: token },
    include: { event: true },
  });

  // Solo quien ya tiene lugar puede confirmar. Los de lista de espera no
  // pueden auto-promoverse llamando a esta acción directamente.
  if (
    !registration ||
    (registration.status !== "REGISTERED" && registration.status !== "CONFIRMED")
  ) {
    return;
  }

  // La página solo ofrece el botón en eventos publicados; la acción también lo
  // exige, porque se puede invocar directamente.
  if (registration.event.status !== "PUBLISHED") return;

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

/** El asistente da de baja su lugar, que vuelve al cupo disponible. */
export async function cancelRegistration(token: string) {
  const registration = await prisma.registration.findUnique({
    where: { accessToken: token },
    include: { event: true },
  });

  if (!registration) return;
  if (registration.status === "CANCELLED" || registration.status === "ATTENDED") {
    return;
  }
  if (registration.event.endsAt < new Date()) return;

  await prisma.registration.update({
    where: { accessToken: token },
    data: { status: "CANCELLED", confirmedAt: null },
  });

  revalidatePath(`/mi-registro/${token}`);
  revalidateEventViews(registration.eventId);
}

/**
 * El asistente recupera un registro que él mismo canceló. Existe porque el par
 * (evento, correo) es único: sin esto, cancelar dejaría a la persona sin
 * ninguna forma de volver a inscribirse al mismo evento.
 */
export async function reactivateRegistration(token: string) {
  const registration = await prisma.registration.findUnique({
    where: { accessToken: token },
    include: { event: true },
  });

  if (!registration || registration.status !== "CANCELLED") return;
  if (registration.event.status !== "PUBLISHED") return;
  if (registration.event.endsAt < new Date()) return;

  await prisma.$transaction(async (tx) => {
    const { isFull } = await lockEventAndReadCapacity(tx, registration.eventId);

    await tx.registration.update({
      where: { id: registration.id },
      data: { status: isFull ? "WAITLIST" : "REGISTERED" },
    });
  });

  revalidatePath(`/mi-registro/${token}`);
  revalidateEventViews(registration.eventId);
}

/** Pase de lista del admin: marca (o desmarca) que la persona sí asistió. */
export async function markAttendance(
  registrationId: string,
  attended: boolean
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autorizado" };

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
  });

  if (!registration) return { ok: false, error: "Registro no encontrado" };

  if (attended) {
    if (
      registration.status !== "REGISTERED" &&
      registration.status !== "CONFIRMED"
    ) {
      return { ok: false, error: "Este registro no tiene lugar asignado" };
    }
  } else if (registration.status !== "ATTENDED") {
    return { ok: false, error: "Este registro no está marcado como asistido" };
  }

  await prisma.registration.update({
    where: { id: registrationId },
    data: {
      status: attended
        ? "ATTENDED"
        : registration.confirmedAt
          ? "CONFIRMED"
          : "REGISTERED",
    },
  });

  revalidateEventViews(registration.eventId);
  revalidatePath(`/admin/registros/${registrationId}`);
  revalidatePath(`/mi-registro/${registration.accessToken}`);
  return { ok: true };
}

/** El admin da de baja un registro (por ejemplo, si la persona avisa por teléfono). */
export async function cancelRegistrationAsAdmin(
  registrationId: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autorizado" };

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
  });

  if (!registration) return { ok: false, error: "Registro no encontrado" };
  if (registration.status === "CANCELLED") {
    return { ok: false, error: "Este registro ya está cancelado" };
  }

  await prisma.registration.update({
    where: { id: registrationId },
    data: { status: "CANCELLED", confirmedAt: null },
  });

  revalidateEventViews(registration.eventId);
  revalidatePath(`/admin/registros/${registrationId}`);
  revalidatePath(`/mi-registro/${registration.accessToken}`);
  return { ok: true };
}
