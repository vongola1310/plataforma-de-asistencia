"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CertificateFormState } from "@/actions/emails";

export function CertificateForm({
  action,
  defaultUrl,
}: {
  action: (
    prevState: CertificateFormState,
    formData: FormData
  ) => Promise<CertificateFormState>;
  defaultUrl?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="certificateUrl">Link de la constancia</Label>
        <Input
          id="certificateUrl"
          name="certificateUrl"
          type="url"
          placeholder="https://..."
          defaultValue={defaultUrl ?? ""}
          required
        />
        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="sendNow" defaultChecked />
        Enviar correo de aviso ahora
      </label>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar constancia"}
      </Button>
    </form>
  );
}
