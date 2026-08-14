import type { CapacityInfo } from "@/lib/capacity";

/**
 * Aviso de cupo para las páginas públicas. No renderiza nada cuando el evento
 * no tiene límite de cupo o cuando todavía queda lugar de sobra.
 */
export function CapacityNotice({ capacity }: { capacity: CapacityInfo }) {
  if (capacity.capacity === null) return null;

  if (capacity.isFull) {
    return (
      <div className="mb-6 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
        <p className="font-medium text-amber-900 dark:text-amber-200">
          Cupo lleno ({capacity.occupied}/{capacity.capacity} lugares ocupados)
        </p>
        <p className="mt-1 text-amber-900/80 dark:text-amber-200/80">
          Aún puedes registrarte: quedarás en <strong>lista de espera</strong> y
          te contactaremos si se libera un lugar.
        </p>
      </div>
    );
  }

  return (
    <p className="mb-6 text-sm text-muted-foreground">
      Lugares disponibles: <strong>{capacity.remaining}</strong> de{" "}
      {capacity.capacity}
    </p>
  );
}
