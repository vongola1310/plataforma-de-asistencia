import { z } from "zod";

export const registrationSchema = z.object({
  gradoAcademico: z.string().trim().min(2, "Requerido"),
  nombreCompleto: z.string().trim().min(3, "Ingresa tu nombre completo"),
  email: z.string().trim().email("Email inválido"),
  telefono: z.string().trim().min(7, "Número de contacto inválido"),
  institucion: z.string().trim().min(2, "Requerido"),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
