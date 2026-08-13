"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { surveySchema } from "@/lib/validations/survey.schema";

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

  revalidatePath(`/mi-registro/${token}`);
  revalidatePath(`/admin/eventos/${registration.eventId}/registros`);
  redirect(`/mi-registro/${token}`);
}
