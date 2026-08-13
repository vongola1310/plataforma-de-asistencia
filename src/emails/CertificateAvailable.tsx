import { EmailLayout, emailStyles } from "@/emails/components/EmailLayout";

export function CertificateAvailable({
  nombreCompleto,
  eventTitle,
  certificateUrl,
}: {
  nombreCompleto: string;
  eventTitle: string;
  certificateUrl: string;
}) {
  return (
    <EmailLayout previewText={`Tu constancia de ${eventTitle} ya está disponible`}>
      <p style={emailStyles.heading}>Tu constancia está lista</p>
      <p style={emailStyles.paragraph}>Hola {nombreCompleto},</p>
      <p style={emailStyles.paragraph}>
        Gracias por participar en <strong>{eventTitle}</strong>. Ya puedes
        descargar tu constancia de asistencia.
      </p>
      <a href={certificateUrl} style={emailStyles.button}>
        Descargar constancia
      </a>
    </EmailLayout>
  );
}
