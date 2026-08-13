import { Resend } from "resend";

let client: Resend | null = null;

/** Instancia el cliente de Resend de forma perezosa para no romper el build/arranque si aún no hay RESEND_API_KEY configurada. */
export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Showroom <onboarding@resend.dev>";
