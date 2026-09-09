import type {
  Prisma,
  PrismaClient,
  RegistrationStatus,
} from "@/generated/prisma/client";

/**
 * Estados que ocupan un lugar del cupo. Los cancelados liberan su lugar y los
 * de lista de espera todavía no ocupan ninguno.
 */
export const OCCUPYING_STATUSES = [
  "REGISTERED",
  "CONFIRMED",
  "ATTENDED",
] as const;

/** ¿Este registro tiene (o tuvo) un lugar asignado en el evento? */
export function occupiesSpot(status: RegistrationStatus): boolean {
  return (OCCUPYING_STATUSES as readonly string[]).includes(status);
}

export const occupyingWhere: Prisma.RegistrationWhereInput = {
  status: { in: [...OCCUPYING_STATUSES] },
};

export type CapacityInfo = {
  /** null = evento sin límite de cupo. */
  capacity: number | null;
  occupied: number;
  /** null cuando no hay límite. */
  remaining: number | null;
  isFull: boolean;
};

type PrismaLike = PrismaClient | Prisma.TransactionClient;

export async function getCapacityInfo(
  client: PrismaLike,
  eventId: string,
  capacity: number | null
): Promise<CapacityInfo> {
  const occupied = await client.registration.count({
    where: { eventId, ...occupyingWhere },
  });

  if (capacity === null) {
    return { capacity: null, occupied, remaining: null, isFull: false };
  }

  return {
    capacity,
    occupied,
    remaining: Math.max(0, capacity - occupied),
    isFull: occupied >= capacity,
  };
}
