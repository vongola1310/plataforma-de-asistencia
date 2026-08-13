import { EmailLayout, emailStyles } from "@/emails/components/EmailLayout";

export function EventReminder({
  nombreCompleto,
  eventTitle,
  eventDate,
  eventLocation,
  accessUrl,
  webexLink,
}: {
  nombreCompleto: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: string | null;
  accessUrl: string;
  webexLink?: string | null;
}) {
  return (
    <EmailLayout previewText={`Recordatorio: ${eventTitle} es mañana`}>
      <p style={emailStyles.heading}>Tu evento es mañana</p>
      <p style={emailStyles.paragraph}>Hola {nombreCompleto},</p>
      <p style={emailStyles.paragraph}>
        Te recordamos que <strong>{eventTitle}</strong> es mañana.
      </p>
      <p style={emailStyles.label}>Fecha y hora</p>
      <p style={emailStyles.paragraph}>{eventDate}</p>
      {eventLocation ? (
        <>
          <p style={emailStyles.label}>Ubicación</p>
          <p style={emailStyles.paragraph}>{eventLocation}</p>
        </>
      ) : null}
      {webexLink ? (
        <>
          <p style={emailStyles.label}>Conexión Webex</p>
          <p style={emailStyles.paragraph}>{webexLink}</p>
        </>
      ) : null}
      <a href={accessUrl} style={emailStyles.button}>
        Ver detalles del evento
      </a>
    </EmailLayout>
  );
}
