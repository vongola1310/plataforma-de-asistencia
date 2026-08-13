"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resendEmailLog } from "@/actions/emails";

export function ResendEmailButton({ logId }: { logId: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState<"ok" | "error" | null>(null);

  function handleClick() {
    setDone(null);
    startTransition(async () => {
      const result = await resendEmailLog(logId);
      setDone(result.success ? "ok" : "error");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="ghost" size="sm" onClick={handleClick} disabled={isPending}>
        {isPending ? "Reenviando..." : "Reenviar"}
      </Button>
      {done === "ok" ? (
        <span className="text-xs text-muted-foreground">Enviado</span>
      ) : null}
      {done === "error" ? (
        <span className="text-xs text-destructive">Falló de nuevo</span>
      ) : null}
    </div>
  );
}
