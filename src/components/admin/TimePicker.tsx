"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const STEP_MINUTES = 15;

const TIME_OPTIONS = Array.from(
  { length: (24 * 60) / STEP_MINUTES },
  (_, i) => minutesToTime(i * STEP_MINUTES)
);

export function minutesToTime(total: number): string {
  const normalized = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Lista de horas cada 15 minutos, para elegir con un clic en vez de teclear.
 *
 * No usa <select> a propósito: React 19 resetea el formulario al terminar una
 * server action y no vuelve a sincronizar los <select> controlados, así que la
 * hora elegida desaparecía de la pantalla tras un error de validación aunque
 * siguiera en el estado. Un botón con su lista no es un control de formulario,
 * de modo que el reset no lo toca.
 */
export function TimePicker({
  id,
  value,
  onChange,
  ariaLabel,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Una hora guardada fuera de la rejilla de 15 minutos no debe perderse.
  const options =
    value && !TIME_OPTIONS.includes(value)
      ? [...TIME_OPTIONS, value].sort()
      : TIME_OPTIONS;

  useEffect(() => {
    if (!open) return;

    selectedRef.current?.scrollIntoView({ block: "center" });

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-28 items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {value || "--:--"}
        </span>
        <span aria-hidden className="text-muted-foreground">
          ▾
        </span>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-9 z-50 max-h-60 w-28 overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg"
        >
          {options.map((time) => {
            const isSelected = time === value;
            return (
              <li key={time} role="option" aria-selected={isSelected}>
                <button
                  ref={isSelected ? selectedRef : undefined}
                  type="button"
                  onClick={() => {
                    onChange(time);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-md px-2 py-1 text-left text-sm tabular-nums transition-colors hover:bg-accent",
                    isSelected &&
                      "bg-primary font-semibold text-primary-foreground hover:bg-primary"
                  )}
                >
                  {time}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
