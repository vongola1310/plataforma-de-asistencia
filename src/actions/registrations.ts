"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateAccessToken } from "@/lib/tokens";
import { registrationSchema } from "@/lib/validations/registration.schema";
import { Prisma } from "@/generated/prisma/client";
import { sendRegistrationConfirmationEmail } from "@/lib/email-templates";

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
    const registration = await prisma.registration.create({
      data: {
        eventId,
        gradoAcademico: data.gradoAcademico,
        nombreCompleto: data.nombreCompleto,
        email: data.email,
        telefono: data.telefono,
        institucion: data.institucion,
        accessToken: generateAccessToken(),
      },
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

export async function confirmAttendance(token: string) {
  const registration = await prisma.registration.findUnique({
    where: { accessToken: token },
  });

  if (!registration || registration.status === "CANCELLED") return;

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
