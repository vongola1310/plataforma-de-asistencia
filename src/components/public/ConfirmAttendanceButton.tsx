"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmAttendanceButton({
  action,
}: {
  action: () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      onClick={() => startTransition(() => action())}
      disabled={isPending}
    >
      {isPending ? "Confirmando..." : "Confirmar asistencia"}
    </Button>
  );
}
