"use client";

import { useActionState, useState } from "react";
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

type RatingName = (typeof RATING_FIELDS)[number]["name"];

function RatingField({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((option) => (
          <label key={option} className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === String(option)}
              onChange={(e) => onChange(e.target.value)}
              required
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
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

  // Controlado a propósito: React 19 resetea el formulario al terminar la
  // acción, y con campos no controlados un error borraba las respuestas.
  const [ratings, setRatings] = useState<Record<RatingName, string>>({
    ratingContent: "",
    ratingInstructor: "",
    ratingLogistics: "",
    ratingGeneral: "",
  });
  const [comments, setComments] = useState("");

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      {RATING_FIELDS.map((field) => (
        <RatingField
          key={field.name}
          name={field.name}
          label={field.label}
          value={ratings[field.name]}
          onChange={(value) =>
            setRatings((prev) => ({ ...prev, [field.name]: value }))
          }
        />
      ))}

      <div className="space-y-2">
        <Label htmlFor="comments">Comentarios (opcional)</Label>
        <Textarea
          id="comments"
          name="comments"
          rows={4}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar encuesta"}
      </Button>
    </form>
  );
}
