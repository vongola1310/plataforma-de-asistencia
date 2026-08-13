"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SurveyFormState } from "@/actions/survey";

const RATING_FIELDS = [
  { name: "ratingContent", label: "Contenido de la capacitación" },
  { name: "ratingInstructor", label: "Desempeño del instructor" },
  { name: "ratingLogistics", label: "Logística y organización" },
  { name: "ratingGeneral", label: "Satisfacción general" },
] as const;

function RatingField({ name, label }: { name: string; label: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((value) => (
          <label key={value} className="flex items-center gap-1.5 text-sm">
            <input type="radio" name={name} value={value} required />
            {value}
          </label>
        ))}
      </div>
    </div>
  );
}

export function SurveyForm({
  action,
}: {
  action: (
    prevState: SurveyFormState,
    formData: FormData
  ) => Promise<SurveyFormState>;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      {RATING_FIELDS.map((field) => (
        <RatingField key={field.name} name={field.name} label={field.label} />
      ))}

      <div className="space-y-2">
        <Label htmlFor="comments">Comentarios (opcional)</Label>
        <Textarea id="comments" name="comments" rows={4} />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar encuesta"}
      </Button>
    </form>
  );
}
