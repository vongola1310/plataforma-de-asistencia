"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AgendaEditor, type AgendaItem } from "@/components/admin/AgendaEditor";
import { EventScheduleFields } from "@/components/admin/EventScheduleFields";
import type { EventFormState } from "@/actions/events";

type EventDefaults = {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: string;
  webexLink: string;
  webexPassword: string;
  webexMeetingNumber: string;
  agenda: AgendaItem[];
  status: string;
};

const EMPTY_DEFAULTS: EventDefaults = {
  title: "",
  description: "",
  location: "",
  startsAt: "",
  endsAt: "",
  capacity: "",
  webexLink: "",
  webexPassword: "",
  webexMeetingNumber: "",
  agenda: [],
  status: "DRAFT",
};

export function EventForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: EventFormState, formData: FormData) => Promise<EventFormState>;
  defaultValues?: Partial<EventDefaults>;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  // El formulario es controlado a propósito: React 19 resetea el formulario al
  // terminar una acción, así que con campos no controlados un error de
  // validación borraba todo lo capturado.
  const [values, setValues] = useState<EventDefaults>(() => ({
    ...EMPTY_DEFAULTS,
    ...defaultValues,
  }));

  const errors = state.fieldErrors ?? {};
  const set = <K extends keyof EventDefaults>(key: K, value: EventDefaults[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p
          role="status"
          className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm font-medium text-primary"
        >
          Cambios guardados.
        </p>
      ) : null}

      {Object.keys(errors).length > 0 ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          Revisa los campos marcados. No se perdió nada de lo que capturaste.
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          required
        />
        {errors.title ? <p className="text-sm text-destructive">{errors.title[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción / detalles del evento</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          required
        />
        {errors.description ? (
          <p className="text-sm text-destructive">{errors.description[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Temario</Label>
        <AgendaEditor
          items={values.agenda}
          onChange={(agenda) => set("agenda", agenda)}
        />
      </div>

      <EventScheduleFields
        startsAt={values.startsAt}
        endsAt={values.endsAt}
        onChange={({ startsAt, endsAt }) =>
          setValues((prev) => ({ ...prev, startsAt, endsAt }))
        }
        startError={errors.startsAt?.[0]}
        endError={errors.endsAt?.[0]}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Ubicación</Label>
          <Input
            id="location"
            name="location"
            value={values.location}
            onChange={(e) => set("location", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacidad (opcional)</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            value={values.capacity}
            onChange={(e) => set("capacity", e.target.value)}
          />
          {errors.capacity ? (
            <p className="text-sm text-destructive">{errors.capacity[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Estado</Label>
        <select
          id="status"
          name="status"
          value={values.status}
          onChange={(e) => set("status", e.target.value)}
          className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="DRAFT">Borrador</option>
          <option value="PUBLISHED">Publicado</option>
          <option value="CANCELLED">Cancelado</option>
          <option value="COMPLETED">Completado</option>
        </select>
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <p className="text-sm font-medium">Datos de conexión Webex (manual)</p>
        <p className="text-xs text-muted-foreground">
          Crea la sesión directamente en Webex y pega aquí el link y los datos de acceso.
        </p>
        <div className="space-y-2">
          <Label htmlFor="webexLink">Link de Webex</Label>
          <Input
            id="webexLink"
            name="webexLink"
            value={values.webexLink}
            onChange={(e) => set("webexLink", e.target.value)}
            placeholder="https://..."
          />
          {errors.webexLink ? (
            <p className="text-sm text-destructive">{errors.webexLink[0]}</p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="webexMeetingNumber">Número de reunión</Label>
            <Input
              id="webexMeetingNumber"
              name="webexMeetingNumber"
              value={values.webexMeetingNumber}
              onChange={(e) => set("webexMeetingNumber", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webexPassword">Contraseña</Label>
            <Input
              id="webexPassword"
              name="webexPassword"
              value={values.webexPassword}
              onChange={(e) => set("webexPassword", e.target.value)}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
