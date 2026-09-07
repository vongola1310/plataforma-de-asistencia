import { headers } from "next/headers";

/**
 * Origen público de la app, tomado del request y no de una variable de entorno.
 * NEXT_PUBLIC_BASE_URL se inlinea en build: si no está configurada o cambia el
 * dominio, los links de acceso salen apuntando a localhost. Esto siempre
 * refleja el dominio por el que realmente entró el usuario.
 */
export async function getBaseUrl(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");

  if (!host) {
    return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  }

  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const protocol =
    headerList.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");

  return `${protocol}://${host}`;
}
