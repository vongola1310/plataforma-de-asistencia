"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RegistrationFormState } from "@/actions/registrations";

const FIELDS = [
  { name: "nombreCompleto", label: "Nombre completo", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "telefono", label: "Número de contacto", type: "tel", autoComplete: "tel" },
  { name: "gradoAcademico", label: "Grado académico", type: "text", autoComplete: "off" },
  { name: "institucion", label: "Institución a la que perteneces", type: "text", autoComplete: "organization" },
] as const;

type FieldName = (typeof FIELDS)[number]["name"];

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

  // Controlado a propósito: React 19 resetea el formulario cuando la acción
  // termina, y con campos no controlados un error de validación obligaba a
  // capturar todo otra vez.
  const [values, setValues] = useState<Record<FieldName, string>>({
    nombreCompleto: "",
    email: "",
    telefono: "",
    gradoAcademico: "",
    institucion: "",
  });

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      {FIELDS.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            value={values[field.name]}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
            }
            required
          />
          {errors[field.name] ? (
            <p className="text-sm text-destructive">{errors[field.name][0]}</p>
          ) : null}
        </div>
      ))}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando..." : submitLabel}
      </Button>
    </form>
  );
}
