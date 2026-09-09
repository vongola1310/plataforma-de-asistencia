import { z } from "zod";

export const agendaItemSchema = z.object({
  hora: z.string().min(1, "Requerido"),
  tema: z.string().min(1, "Requerido"),
});

/**
 * Formato de los inputs de fecha y hora ("2026-11-20T09:00"). Se valida el
 * formato completo a propósito: antes bastaba con que la cadena no fuera vacía,
 * así que una fecha a medias se guardaba como una hora cualquiera.
 */
const dateTimeLocal = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Elige la fecha y la hora")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "Fecha u hora inválida",
  });

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "El título es muy corto"),
    description: z.string().trim().min(10, "Agrega más detalle a la descripción"),
    location: z.string().trim().optional().or(z.literal("")),
    startsAt: dateTimeLocal,
    endsAt: dateTimeLocal,
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
