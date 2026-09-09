"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/admin/DatePicker";
import {
  TimePicker,
  minutesToTime,
  timeToMinutes,
} from "@/components/admin/TimePicker";

/** Duración que se asume al elegir la hora de inicio, en minutos. */
const DEFAULT_DURATION_MINUTES = 120;

/** "2026-11-20T09:00" -> { date: "2026-11-20", time: "09:00" } */
function splitDateTime(value: string) {
  const [date = "", time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) };
}

/**
 * Une las dos mitades admitiendo valores a medias, para que elegir primero el
 * día (o primero la hora) no descarte lo ya elegido. Un valor incompleto llega
 * así al servidor y el esquema lo rechaza con un mensaje claro.
 */
function joinDateTime(date: string, time: string) {
  if (date && time) return `${date}T${time}`;
  if (date) return date;
  if (time) return `T${time}`;
  return "";
}

const COMPLETE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function isEndBeforeStart(start: string, end: string) {
  return COMPLETE.test(start) && COMPLETE.test(end) && end <= start;
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00`);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Fecha y hora del evento. Sustituye a los dos `datetime-local`, que obligaban
 * a teclear la fecha y la hora a mano.
 *
 * Lo que se rellena solo, para no capturar dos veces lo mismo:
 *  - al elegir el día de inicio, el de fin se pone el mismo día;
 *  - al elegir la hora de inicio, la de fin se pone dos horas después, saltando
 *    al día siguiente si se pasa de la medianoche.
 * Cualquiera de los dos se puede cambiar después a mano; solo se autocompletan
 * cuando están vacíos o quedarían antes del inicio.
 */
export function EventScheduleFields({
  startsAt,
  endsAt,
  onChange,
  startError,
  endError,
}: {
  startsAt: string;
  endsAt: string;
  onChange: (next: { startsAt: string; endsAt: string }) => void;
  startError?: string;
  endError?: string;
}) {
  const start = splitDateTime(startsAt);
  const end = splitDateTime(endsAt);

  // La hora de fin sigue a la de inicio hasta que alguien la fija a mano; a
  // partir de ahí se respeta. Al editar un evento ya guardado la damos por
  // fijada, para no pisar una duración que alguien eligió a propósito.
  const [endTimeSet, setEndTimeSet] = useState(() => Boolean(end.time));

  /** Fin por defecto: la duración estándar después del inicio. */
  function defaultEnd(date: string, time: string) {
    if (!time) return joinDateTime(date, "");
    const total = timeToMinutes(time) + DEFAULT_DURATION_MINUTES;
    const endDate = total >= 1440 && date ? addDays(date, 1) : date;
    return joinDateTime(endDate, minutesToTime(total));
  }

  function setStartDate(date: string) {
    const nextStart = joinDateTime(date, start.time);
    // El fin sigue al inicio mientras el usuario no lo haya movido por su cuenta.
    const endFollows = !end.date || end.date === start.date;
    const nextEndDate = endFollows ? date : end.date;
    let nextEnd = joinDateTime(nextEndDate, end.time);
    if (isEndBeforeStart(nextStart, nextEnd)) {
      nextEnd = defaultEnd(date, start.time);
    }
    onChange({ startsAt: nextStart, endsAt: nextEnd });
  }

  function setStartTime(time: string) {
    const nextStart = joinDateTime(start.date, time);
    let nextEnd = joinDateTime(end.date, end.time);

    if (time && (!endTimeSet || isEndBeforeStart(nextStart, nextEnd))) {
      nextEnd = defaultEnd(start.date || end.date, time);
    }

    onChange({ startsAt: nextStart, endsAt: nextEnd });
  }

  return (
    <fieldset className="space-y-3 rounded-md border p-4">
      <legend className="px-1 text-sm font-medium">Fecha y hora</legend>

      <div className="space-y-2">
        <Label htmlFor="startsAtDate">Inicio</Label>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <DatePicker
              id="startsAtDate"
              label="Fecha de inicio"
              value={start.date}
              onChange={setStartDate}
            />
          </div>
          <TimePicker
            id="startsAtTime"
            ariaLabel="Hora de inicio"
            value={start.time}
            onChange={setStartTime}
          />
        </div>
        {startError ? (
          <p className="text-sm text-destructive">{startError}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="endsAtDate">Fin</Label>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <DatePicker
              id="endsAtDate"
              label="Fecha de fin"
              value={end.date}
              onChange={(date) =>
                onChange({ startsAt, endsAt: joinDateTime(date, end.time) })
              }
            />
          </div>
          <TimePicker
            id="endsAtTime"
            ariaLabel="Hora de fin"
            value={end.time}
            onChange={(time) => {
              setEndTimeSet(Boolean(time));
              onChange({
                startsAt,
                endsAt: joinDateTime(end.date || start.date, time),
              });
            }}
          />
        </div>
        {endError ? <p className="text-sm text-destructive">{endError}</p> : null}
      </div>

      <input type="hidden" name="startsAt" value={startsAt} />
      <input type="hidden" name="endsAt" value={endsAt} />
    </fieldset>
  );
}
