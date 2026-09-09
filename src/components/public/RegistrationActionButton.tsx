"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

/**
 * Botón para las acciones que el asistente ejecuta sobre su propio registro
 * (confirmar, cancelar, reactivar). `confirmText` pide confirmación antes de
 * las que son destructivas.
 */
export function RegistrationActionButton({
  action,
  label,
  pendingLabel,
  confirmText,
  variant = "default",
}: {
  action: () => Promise<void>;
  label: string;
  pendingLabel: string;
  confirmText?: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (confirmText && !window.confirm(confirmText)) return;
    startTransition(() => action());
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? pendingLabel : label}
    </Button>
  );
}
