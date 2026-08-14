/** Bloque de fecha tipo calendario, para dar peso visual a las tarjetas. */
export function EventDateBadge({ date }: { date: Date }) {
  const dia = new Intl.DateTimeFormat("es-MX", { day: "2-digit" }).format(date);
  const mes = new Intl.DateTimeFormat("es-MX", { month: "short" })
    .format(date)
    .replace(".", "")
    .toUpperCase();

  return (
    <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
      <span className="text-2xl font-bold leading-none text-primary">{dia}</span>
      <span className="mt-1 text-[0.65rem] font-semibold tracking-widest text-primary/80">
        {mes}
      </span>
    </div>
  );
}
