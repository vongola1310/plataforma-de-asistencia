"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCertificateAvailableEmail } from "@/lib/email-templates";

export type CertificateFormState = {
  error?: string;
};

const certificateUrlSchema = z.string().trim().url("URL inválida");

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");
}

export async function setCertificateAndNotify(
  registrationId: string,
  _prevState: CertificateFormState,
  formData: FormData
): Promise<CertificateFormState> {
  await requireAdmin();

  const parsed = certificateUrlSchema.safeParse(formData.get("certificateUrl"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "URL inválida" };
  }

  const registration = await prisma.registration.update({
    where: { id: registrationId },
    data: { certificateUrl: parsed.data },
    include: { event: true },
  });

  const sendNow = formData.get("sendNow") === "on";

  if (sendNow) {
    const result = await sendCertificateAvailableEmail(
      registration,
      registration.event
    );
    if (result.success) {
      await prisma.registration.update({
        where: { id: registrationId },
        data: { certificateSentAt: new Date() },
      });
    }
  }

  revalidatePath(`/admin/registros/${registrationId}`);
  revalidatePath(`/admin/eventos/${registration.eventId}/registros`);
  revalidatePath(`/mi-registro/${registration.accessToken}`);
  return {};
}

export async function sendPendingCertificates(eventId: string) {
  await requireAdmin();

  const registrations = await prisma.registration.findMany({
    where: {
      eventId,
      certificateUrl: { not: null },
      certificateSentAt: null,
      status: { not: "CANCELLED" },
    },
    include: { event: true },
  });

  let enviados = 0;
  let fallidos = 0;

  for (const registration of registrations) {
    const result = await sendCertificateAvailableEmail(
      registration,
      registration.event
    );
    if (result.success) {
      await prisma.registration.update({
        where: { id: registration.id },
        data: { certificateSentAt: new Date() },
      });
      enviados += 1;
    } else {
      fallidos += 1;
    }
  }

  revalidatePath(`/admin/eventos/${eventId}/registros`);
  return { enviados, fallidos };
}

export async function resendEmailLog(logId: string) {
  await requireAdmin();

  const log = await prisma.emailLog.findUnique({
    where: { id: logId },
    include: { registration: { include: { event: true } } },
  });

  if (!log || !log.registration) return { success: false };

  const { registration } = log;
  const { event } = registration;

  let result: { success: boolean };
  switch (log.type) {
    case "REGISTRATION_CONFIRMATION": {
      const { sendRegistrationConfirmationEmail } = await import(
        "@/lib/email-templates"
      );
      result = await sendRegistrationConfirmationEmail(registration, event);
      break;
    }
    case "EVENT_REMINDER": {
      const { sendEventReminderEmail } = await import("@/lib/email-templates");
      result = await sendEventReminderEmail(registration, event);
      if (result.success) {
        await prisma.registration.update({
          where: { id: registration.id },
          data: { reminderSentAt: new Date() },
        });
      }
      break;
    }
    case "CERTIFICATE_AVAILABLE": {
      if (!registration.certificateUrl) return { success: false };
      result = await sendCertificateAvailableEmail(registration, event);
      if (result.success) {
        await prisma.registration.update({
          where: { id: registration.id },
          data: { certificateSentAt: new Date() },
        });
      }
      break;
    }
    default:
      result = { success: false };
  }

  revalidatePath("/admin/emails");
  return result;
}
