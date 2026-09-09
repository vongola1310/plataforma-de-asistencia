"use client";

import { useEffect, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** "2026-11-20" -> Date local, sin sorpresas de zona horaria. */
function parseISODate(value: string): Date | null {
  if (!value) return null;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Calendario mensual en español. Sustituye a escribir la fecha a mano: el campo
 * muestra la fecha en largo y despliega el mes para elegir el día con un clic.
 */
export function DatePicker({
  value,
  onChange,
  id,
  label,
}: {
  /** Fecha en formato "yyyy-MM-dd". */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
}) {
  const selected = parseISODate(value);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    () => selected ?? new Date()
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return;

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

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(visibleMonth), { locale: es }),
    end: endOfWeek(endOfMonth(visibleMonth), { locale: es }),
  });

  const weekdayNames = eachDayOfInterval({
    start: startOfWeek(new Date(), { locale: es }),
    end: endOfWeek(new Date(), { locale: es }),
  }).map((day) => format(day, "EEEEE", { locale: es }).toUpperCase());

  function pick(day: Date) {
    onChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => {
          // Al abrirlo, encuadra el mes de la fecha ya elegida.
          if (!open && selected) setVisibleMonth(selected);
          setOpen((v) => !v);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        className="flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        <span className={cn(!selected && "text-muted-foreground")}>
          {selected
            ? format(selected, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
            : "Elegir fecha"}
        </span>
        <span aria-hidden className="ml-2 text-muted-foreground">
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Calendario"
          className="absolute left-0 top-9 z-50 w-72 rounded-xl border bg-popover p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Mes anterior"
              onClick={() => setVisibleMonth((m) => addMonths(m, -1))}
            >
              ‹
            </Button>
            <span className="text-sm font-semibold capitalize">
              {format(visibleMonth, "MMMM yyyy", { locale: es })}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Mes siguiente"
              onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
            >
              ›
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {weekdayNames.map((name, i) => (
              <span
                key={i}
                className="pb-1 text-[0.65rem] font-semibold text-muted-foreground"
              >
                {name}
              </span>
            ))}
            {days.map((day) => {
              const isSelected = selected ? isSameDay(day, selected) : false;
              const outside = !isSameMonth(day, visibleMonth);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => pick(day)}
                  aria-current={isToday(day) ? "date" : undefined}
                  aria-pressed={isSelected}
                  className={cn(
                    "size-8 rounded-md text-sm transition-colors hover:bg-accent",
                    outside && "text-muted-foreground/40",
                    isToday(day) && !isSelected && "font-bold text-primary",
                    isSelected &&
                      "bg-primary font-semibold text-primary-foreground hover:bg-primary"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex justify-end border-t pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => pick(new Date())}
            >
              Hoy
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
