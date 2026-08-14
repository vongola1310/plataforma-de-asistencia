"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RegistrationFormState } from "@/actions/registrations";

export function RegistrationForm({
  action,
  submitLabel = "Confirmar registro",
}: {
  action: (
    prevState: RegistrationFormState,
    formData: FormData
  ) => Promise<RegistrationFormState>;
  submitLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="space-y-2">
        <Label htmlFor="nombreCompleto">Nombre completo</Label>
        <Input id="nombreCompleto" name="nombreCompleto" required />
        {errors.nombreCompleto ? (
          <p className="text-sm text-destructive">{errors.nombreCompleto[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
        {errors.email ? <p className="text-sm text-destructive">{errors.email[0]}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefono">Número de contacto</Label>
        <Input id="telefono" name="telefono" type="tel" required />
        {errors.telefono ? (
          <p className="text-sm text-destructive">{errors.telefono[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="gradoAcademico">Grado académico</Label>
        <Input id="gradoAcademico" name="gradoAcademico" required />
        {errors.gradoAcademico ? (
          <p className="text-sm text-destructive">{errors.gradoAcademico[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="institucion">Institución a la que perteneces</Label>
        <Input id="institucion" name="institucion" required />
        {errors.institucion ? (
          <p className="text-sm text-destructive">{errors.institucion[0]}</p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando..." : submitLabel}
      </Button>
    </form>
  );
}
