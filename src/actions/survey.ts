"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { surveySchema } from "@/lib/validations/survey.schema";
import { occupiesSpot } from "@/lib/capacity";

export type SurveyFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function submitSurvey(
  token: string,
  _prevState: SurveyFormState,
  formData: FormData
): Promise<SurveyFormState> {
  const registration = await prisma.registration.findUnique({
    where: { accessToken: token },
    include: { event: true, surveyResponse: true },
  });

  if (!registration) {
    return { error: "Registro no encontrado." };
  }

  if (registration.event.endsAt > new Date()) {
    return { error: "La encuesta estará disponible después del evento." };
  }

  // Solo responde quien tuvo lugar: los cancelados y los de lista de espera no
  // asistieron.
  if (!occupiesSpot(registration.status)) {
    return { error: "Esta encuesta es solo para quienes tuvieron lugar en el evento." };
  }

  if (registration.surveyResponse) {
    redirect(`/mi-registro/${token}`);
  }

  const parsed = surveySchema.safeParse({
    ratingContent: formData.get("ratingContent"),
    ratingInstructor: formData.get("ratingInstructor"),
    ratingLogistics: formData.get("ratingLogistics"),
    ratingGeneral: formData.get("ratingGeneral"),
    comments: formData.get("comments"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  try {
    await prisma.surveyResponse.create({
      data: {
        registrationId: registration.id,
        ratingContent: data.ratingContent,
        ratingInstructor: data.ratingInstructor,
        ratingLogistics: data.ratingLogistics,
        ratingGeneral: data.ratingGeneral,
        comments: data.comments || null,
      },
    });
  } catch (error) {
    // Dos envíos casi simultáneos pasan ambos la comprobación de arriba; el
    // segundo choca con el índice único y para el asistente ya está respondida.
    const isDuplicate =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002";
    if (!isDuplicate) throw error;
  }

  revalidatePath(`/mi-registro/${token}`);
  revalidatePath(`/admin/eventos/${registration.eventId}/registros`);
  redirect(`/mi-registro/${token}`);
}
