import { z } from "zod";

export const agendaItemSchema = z.object({
  hora: z.string().min(1, "Requerido"),
  tema: z.string().min(1, "Requerido"),
});

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "El título es muy corto"),
    description: z.string().trim().min(10, "Agrega más detalle a la descripción"),
    location: z.string().trim().optional().or(z.literal("")),
    startsAt: z.string().min(1, "Requerido"),
    endsAt: z.string().min(1, "Requerido"),
    capacity: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : undefined))
      .refine((val) => val === undefined || (Number.isInteger(val) && val > 0), {
        message: "Debe ser un número entero positivo",
      }),
    webexLink: z.string().trim().url("URL inválida").optional().or(z.literal("")),
    webexPassword: z.string().trim().optional().or(z.literal("")),
    webexMeetingNumber: z.string().trim().optional().or(z.literal("")),
    agenda: z.array(agendaItemSchema).optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: "La fecha de fin debe ser posterior al inicio",
    path: ["endsAt"],
  });

export type EventInput = z.infer<typeof eventSchema>;
