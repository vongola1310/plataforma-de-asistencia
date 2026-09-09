"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validations/event.schema";
import { Prisma, type EventStatus } from "@/generated/prisma/client";

export type EventFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
};

const SESSION_EXPIRED: EventFormState = {
  error: "Tu sesión expiró. Vuelve a entrar en otra pestaña y reintenta; no perderás lo que escribiste.",
};

function parseAgenda(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function parseEventFormData(formData: FormData) {
  return eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    capacity: formData.get("capacity"),
    webexLink: formData.get("webexLink"),
    webexPassword: formData.get("webexPassword"),
    webexMeetingNumber: formData.get("webexMeetingNumber"),
    agenda: parseAgenda(formData.get("agenda")),
    status: formData.get("status"),
  });
}

async function isAdmin() {
  const session = await auth();
  return !!session?.user;
}

/** Un temario vacío debe borrar el anterior, no dejarlo intacto. */
function agendaValue(agenda: { hora: string; tema: string }[] | undefined) {
  return agenda && agenda.length > 0 ? agenda : Prisma.DbNull;
}

function eventData(data: ReturnType<typeof eventSchema.parse>) {
  return {
    title: data.title,
    description: data.description,
    location: data.location || null,
    startsAt: new Date(data.startsAt),
    endsAt: new Date(data.endsAt),
    capacity: data.capacity ?? null,
    webexLink: data.webexLink || null,
    webexPassword: data.webexPassword || null,
    webexMeetingNumber: data.webexMeetingNumber || null,
    agenda: agendaValue(data.agenda),
    status: data.status as EventStatus,
  };
}

export async function createEvent(
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  if (!(await isAdmin())) return SESSION_EXPIRED;

  const parsed = parseEventFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let event;
  try {
    event = await prisma.event.create({ data: eventData(parsed.data) });
  } catch (error) {
    // Un fallo de base de datos no debe tirar la página y perder el formulario.
    console.error("Error creando el evento:", error);
    return { error: "No se pudo guardar el evento. Vuelve a intentarlo." };
  }

  revalidatePath("/admin/eventos");
  revalidatePath("/");
  redirect(`/admin/eventos/${event.id}?creado=1`);
}

export async function updateEvent(
  eventId: string,
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  if (!(await isAdmin())) return SESSION_EXPIRED;

  const parsed = parseEventFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.event.update({
      where: { id: eventId },
      data: eventData(parsed.data),
    });
  } catch (error) {
    console.error("Error actualizando el evento:", error);
    return { error: "No se pudieron guardar los cambios. Vuelve a intentarlo." };
  }

  revalidatePath("/admin/eventos");
  revalidatePath(`/admin/eventos/${eventId}`);
  revalidatePath("/");
  revalidatePath(`/eventos/${eventId}`);
  revalidatePath(`/eventos/${eventId}/registro`);
  return { success: true };
}
