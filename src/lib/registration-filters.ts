import type { Prisma } from "@/generated/prisma/client";
import { occupyingWhere } from "@/lib/capacity";

/**
 * Filtros compartidos entre las métricas del dashboard y la lista de registros,
 * para que el número de una tarjeta y la lista a la que enlaza no se desincronicen.
 *
 * `where` es una función, no un objeto, porque los filtros que dependen de
 * `new Date()` deben evaluarse en cada request y no al cargar el módulo.
 */
export const REGISTRATION_FILTERS = {
  confirmados: {
    label: "Asistencias confirmadas",
    where: (): Prisma.RegistrationWhereInput => ({ status: "CONFIRMED" }),
  },
  "encuesta-pendiente": {
    label: "Encuestas pendientes",
    where: (): Prisma.RegistrationWhereInput => ({
      surveyResponse: null,
      // Solo a quienes tuvieron lugar: los de lista de espera nunca asistieron.
      ...occupyingWhere,
      event: { endsAt: { lt: new Date() } },
    }),
  },
  "constancia-pendiente": {
    label: "Constancias por enviar",
    where: (): Prisma.RegistrationWhereInput => ({
      certificateUrl: { not: null },
      certificateSentAt: null,
      status: { not: "CANCELLED" },
    }),
  },
  "lista-espera": {
    label: "Lista de espera",
    where: (): Prisma.RegistrationWhereInput => ({ status: "WAITLIST" }),
  },
} as const;

export type RegistrationFilterKey = keyof typeof REGISTRATION_FILTERS;

export function isRegistrationFilterKey(
  value: string | undefined
): value is RegistrationFilterKey {
  return !!value && value in REGISTRATION_FILTERS;
}
