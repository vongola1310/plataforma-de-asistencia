"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AgendaEditor } from "@/components/admin/AgendaEditor";
import type { EventFormState } from "@/actions/events";

type AgendaItem = { hora: string; tema: string };

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
  const values = { ...EMPTY_DEFAULTS, ...defaultValues };
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" defaultValue={values.title} required />
        {errors.title ? <p className="text-sm text-destructive">{errors.title[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción / detalles del evento</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={values.description}
          required
        />
        {errors.description ? (
          <p className="text-sm text-destructive">{errors.description[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Temario</Label>
        <AgendaEditor initialItems={values.agenda} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startsAt">Inicio</Label>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={values.startsAt}
            required
          />
          {errors.startsAt ? (
            <p className="text-sm text-destructive">{errors.startsAt[0]}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endsAt">Fin</Label>
          <Input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            defaultValue={values.endsAt}
            required
          />
          {errors.endsAt ? (
            <p className="text-sm text-destructive">{errors.endsAt[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Ubicación</Label>
          <Input id="location" name="location" defaultValue={values.location} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacidad (opcional)</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            defaultValue={values.capacity}
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
          defaultValue={values.status}
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
            defaultValue={values.webexLink}
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
              defaultValue={values.webexMeetingNumber}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webexPassword">Contraseña</Label>
            <Input
              id="webexPassword"
              name="webexPassword"
              defaultValue={values.webexPassword}
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
