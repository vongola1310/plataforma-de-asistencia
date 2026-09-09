import { EmailLayout, emailStyles } from "@/emails/components/EmailLayout";

export function WaitlistPromoted({
  nombreCompleto,
  eventTitle,
  eventDate,
  eventLocation,
  accessUrl,
}: {
  nombreCompleto: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: string | null;
  accessUrl: string;
}) {
  return (
    <EmailLayout previewText={`Se liberó tu lugar en ${eventTitle}`}>
      <p style={emailStyles.heading}>¡Ya tienes lugar!</p>
      <p style={emailStyles.paragraph}>Hola {nombreCompleto},</p>
      <p style={emailStyles.paragraph}>
        Se liberó un lugar en <strong>{eventTitle}</strong> y te lo asignamos.
        Ya no estás en lista de espera: tu registro está confirmado.
      </p>
      <p style={emailStyles.label}>Fecha y hora</p>
      <p style={emailStyles.paragraph}>{eventDate}</p>
      {eventLocation ? (
        <>
          <p style={emailStyles.label}>Ubicación</p>
          <p style={emailStyles.paragraph}>{eventLocation}</p>
        </>
      ) : null}
      <p style={emailStyles.paragraph}>
        Entra a tu link personal para ver los datos de conexión y confirmar tu
        asistencia.
      </p>
      <a href={accessUrl} style={emailStyles.button}>
        Ver mi registro
      </a>
    </EmailLayout>
  );
}
