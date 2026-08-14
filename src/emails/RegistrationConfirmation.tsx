import { EmailLayout, emailStyles } from "@/emails/components/EmailLayout";

export function RegistrationConfirmation({
  nombreCompleto,
  eventTitle,
  eventDate,
  eventLocation,
  accessUrl,
  isWaitlisted = false,
}: {
  nombreCompleto: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: string | null;
  accessUrl: string;
  isWaitlisted?: boolean;
}) {
  return (
    <EmailLayout
      previewText={
        isWaitlisted
          ? `Estás en lista de espera: ${eventTitle}`
          : `Registro confirmado: ${eventTitle}`
      }
    >
      <p style={emailStyles.heading}>
        {isWaitlisted ? "Estás en lista de espera" : "¡Registro confirmado!"}
      </p>
      <p style={emailStyles.paragraph}>Hola {nombreCompleto},</p>
      {isWaitlisted ? (
        <p style={emailStyles.paragraph}>
          El cupo de <strong>{eventTitle}</strong> ya está lleno, así que te
          anotamos en la <strong>lista de espera</strong>. Te avisaremos por
          este medio si se libera un lugar.
        </p>
      ) : (
        <p style={emailStyles.paragraph}>
          Tu registro para <strong>{eventTitle}</strong> se realizó
          correctamente.
        </p>
      )}
      <p style={emailStyles.label}>Fecha y hora</p>
      <p style={emailStyles.paragraph}>{eventDate}</p>
      {eventLocation ? (
        <>
          <p style={emailStyles.label}>Ubicación</p>
          <p style={emailStyles.paragraph}>{eventLocation}</p>
        </>
      ) : null}
      <p style={emailStyles.paragraph}>
        Usa el siguiente link personal para consultar el temario, el croquis
        del showroom, confirmar tu asistencia y (después del evento) llenar
        la encuesta de satisfacción.
      </p>
      <a href={accessUrl} style={emailStyles.button}>
        Ver mi registro
      </a>
    </EmailLayout>
  );
}
