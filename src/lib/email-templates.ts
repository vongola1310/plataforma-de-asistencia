import type { ReactElement } from "react";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";
import { getResendClient, isEmailConfigured, EMAIL_FROM } from "@/lib/resend";
import type { Event, Registration, EmailType } from "@/generated/prisma/client";
import { RegistrationConfirmation } from "@/emails/RegistrationConfirmation";
import { EventReminder } from "@/emails/EventReminder";
import { CertificateAvailable } from "@/emails/CertificateAvailable";

function baseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

async function sendTrackedEmail(params: {
  type: EmailType;
  to: string;
  subject: string;
  react: ReactElement;
  registrationId?: string;
  eventId?: string;
}): Promise<{ success: boolean }> {
  // Sin proveedor configurado no registramos nada: el correo es una comodidad,
  // no un requisito, y llenar el log de fallos ocultaría los errores reales.
  if (!isEmailConfigured()) {
    return { success: false };
  }

  const html = "<!doctype html>" + (await render(params.react));

  const log = await prisma.emailLog.create({
    data: {
      type: params.type,
      recipientEmail: params.to,
      registrationId: params.registrationId,
      eventId: params.eventId,
      status: "PENDING",
    },
  });

  try {
    // isEmailConfigured() ya garantizó la key, así que aquí siempre hay cliente.
    const client = getResendClient()!;

    const result = await client.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html,
    });

    if (result.error) {
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          errorMessage: result.error.message?.slice(0, 500),
        },
      });
      return { success: false };
    }

    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        resendMessageId: result.data?.id,
      },
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "FAILED", errorMessage: message.slice(0, 500) },
    });
    return { success: false };
  }
}

export async function sendRegistrationConfirmationEmail(
  registration: Registration,
  event: Event
) {
  const accessUrl = `${baseUrl()}/mi-registro/${registration.accessToken}`;
  const isWaitlisted = registration.status === "WAITLIST";

  const result = await sendTrackedEmail({
    type: "REGISTRATION_CONFIRMATION",
    to: registration.email,
    subject: isWaitlisted
      ? `Estás en lista de espera: ${event.title}`
      : `Registro confirmado: ${event.title}`,
    react: RegistrationConfirmation({
      nombreCompleto: registration.nombreCompleto,
      eventTitle: event.title,
      eventDate: formatEventDate(event.startsAt),
      eventLocation: event.location,
      accessUrl,
      isWaitlisted,
    }),
    registrationId: registration.id,
    eventId: event.id,
  });

  if (result.success) {
    await prisma.registration.update({
      where: { id: registration.id },
      data: { registrationEmailSentAt: new Date() },
    });
  }

  return result;
}

export async function sendEventReminderEmail(
  registration: Registration,
  event: Event
) {
  const accessUrl = `${baseUrl()}/mi-registro/${registration.accessToken}`;

  return sendTrackedEmail({
    type: "EVENT_REMINDER",
    to: registration.email,
    subject: `Recordatorio: ${event.title} es mañana`,
    react: EventReminder({
      nombreCompleto: registration.nombreCompleto,
      eventTitle: event.title,
      eventDate: formatEventDate(event.startsAt),
      eventLocation: event.location,
      accessUrl,
      webexLink: registration.status === "CANCELLED" ? null : event.webexLink,
    }),
    registrationId: registration.id,
    eventId: event.id,
  });
}

export async function sendCertificateAvailableEmail(
  registration: Registration,
  event: Event
) {
  if (!registration.certificateUrl) {
    throw new Error("La registración no tiene certificateUrl");
  }

  return sendTrackedEmail({
    type: "CERTIFICATE_AVAILABLE",
    to: registration.email,
    subject: `Tu constancia de ${event.title} ya está disponible`,
    react: CertificateAvailable({
      nombreCompleto: registration.nombreCompleto,
      eventTitle: event.title,
      certificateUrl: registration.certificateUrl,
    }),
    registrationId: registration.id,
    eventId: event.id,
  });
}
