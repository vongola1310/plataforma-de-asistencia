"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendPendingCertificates } from "@/actions/emails";

export function BulkCertificateButton({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      const { enviados, fallidos } = await sendPendingCertificates(eventId);
      setResult(`Enviadas: ${enviados} · Fallidas: ${fallidos}`);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="outline" onClick={handleClick} disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar constancias pendientes"}
      </Button>
      {result ? <span className="text-sm text-muted-foreground">{result}</span> : null}
    </div>
  );
}
