"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { promoteFromWaitlist } from "@/actions/registrations";

export function PromoteWaitlistButton({
  registrationId,
}: {
  registrationId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await promoteFromWaitlist(registrationId);
      if (!result.ok) setError(result.error ?? "No se pudo promover");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
        {isPending ? "Promoviendo..." : "Dar lugar"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
