import { headers } from "next/headers";

/**
 * Origen público de la app, resuelto SIEMPRE en tiempo de ejecución.
 *
 * No usar `NEXT_PUBLIC_BASE_URL` para esto: Next sustituye las variables
 * `NEXT_PUBLIC_` por su texto durante `next build`, así que si no estaba
 * definida al compilar (o si después cambia el dominio) los links de acceso
 * quedan apuntando a `http://localhost:3000` de forma permanente, y agregar la
 * variable en el panel no arregla nada hasta el siguiente deploy.
 *
 * Orden de preferencia:
 *  1. `APP_URL`: el dominio canónico. Variable de servidor, leída en runtime.
 *  2. El host del request: correcto en páginas y server actions, y evita tener
 *     que configurar nada en desarrollo.
 *  3. `VERCEL_PROJECT_PRODUCTION_URL`: red de seguridad para el cron, que corre
 *     sin pasar por el dominio público.
 */
export async function getBaseUrl(): Promise<string> {
  const configured = normalizeOrigin(process.env.APP_URL);
  if (configured) return configured;

  const fromRequest = await originFromRequest();
  if (fromRequest) return fromRequest;

  const fromVercel = normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (fromVercel) return fromVercel;

  return "http://localhost:3000";
}

async function originFromRequest(): Promise<string | null> {
  let headerList: Headers;
  try {
    headerList = await headers();
  } catch {
    // Fuera de un request (por ejemplo, en un script) no hay headers que leer.
    return null;
  }

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return null;

  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const protocol =
    headerList.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");

  return `${protocol}://${host}`;
}

/** Acepta "midominio.com" o "https://midominio.com/" y devuelve el origen limpio. */
function normalizeOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}
