"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  cancelRegistrationAsAdmin,
  markAttendance,
  promoteFromWaitlist,
} from "@/actions/registrations";

type Action = {
  label: string;
  pendingLabel: string;
  variant: "outline" | "ghost" | "destructive";
  confirmText?: string;
  run: () => Promise<{ ok: boolean; error?: string }>;
};

/**
 * Acciones del admin sobre un registro: dar lugar a quien está en lista de
 * espera, pasar lista y dar de baja. Se muestran solo las que aplican al estado
 * actual, para no ofrecer transiciones que la acción va a rechazar.
 */
export function RegistrationStatusActions({
  registrationId,
  status,
}: {
  registrationId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions: Action[] = [];

  if (status === "WAITLIST") {
    actions.push({
      label: "Dar lugar",
      pendingLabel: "Promoviendo...",
      variant: "outline",
      run: () => promoteFromWaitlist(registrationId),
    });
  }

  if (status === "REGISTERED" || status === "CONFIRMED") {
    actions.push({
      label: "Marcar asistencia",
      pendingLabel: "Guardando...",
      variant: "outline",
      run: () => markAttendance(registrationId, true),
    });
  }

  if (status === "ATTENDED") {
    actions.push({
      label: "Deshacer asistencia",
      pendingLabel: "Guardando...",
      variant: "ghost",
      run: () => markAttendance(registrationId, false),
    });
  }

  if (status !== "CANCELLED") {
    actions.push({
      label: "Dar de baja",
      pendingLabel: "Cancelando...",
      variant: "ghost",
      confirmText:
        "¿Dar de baja este registro? El lugar volverá al cupo disponible.",
      run: () => cancelRegistrationAsAdmin(registrationId),
    });
  }

  function handleClick(action: Action) {
    if (action.confirmText && !window.confirm(action.confirmText)) return;
    setError(null);
    setRunning(action.label);
    startTransition(async () => {
      const result = await action.run();
      if (!result.ok) setError(result.error ?? "No se pudo completar la acción");
      setRunning(null);
    });
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {actions.map((action) => (
        <Button
          key={action.label}
          type="button"
          variant={action.variant}
          size="sm"
          onClick={() => handleClick(action)}
          disabled={isPending}
        >
          {running === action.label ? action.pendingLabel : action.label}
        </Button>
      ))}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
