"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validations/event.schema";
import type { EventStatus } from "@/generated/prisma/client";

export type EventFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
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

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado");
  }
}

export async function createEvent(
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  await requireAdmin();

  const parsed = parseEventFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      location: data.location || null,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      capacity: data.capacity ?? null,
      webexLink: data.webexLink || null,
      webexPassword: data.webexPassword || null,
      webexMeetingNumber: data.webexMeetingNumber || null,
      agenda: data.agenda && data.agenda.length > 0 ? data.agenda : undefined,
      status: data.status as EventStatus,
    },
  });

  revalidatePath("/admin/eventos");
  revalidatePath("/");
  redirect(`/admin/eventos/${event.id}`);
}

export async function updateEvent(
  eventId: string,
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  await requireAdmin();

  const parsed = parseEventFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  await prisma.event.update({
    where: { id: eventId },
    data: {
      title: data.title,
      description: data.description,
      location: data.location || null,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      capacity: data.capacity ?? null,
      webexLink: data.webexLink || null,
      webexPassword: data.webexPassword || null,
      webexMeetingNumber: data.webexMeetingNumber || null,
      agenda: data.agenda && data.agenda.length > 0 ? data.agenda : undefined,
      status: data.status as EventStatus,
    },
  });

  revalidatePath("/admin/eventos");
  revalidatePath(`/admin/eventos/${eventId}`);
  revalidatePath("/");
  revalidatePath(`/eventos/${eventId}`);
  revalidatePath(`/eventos/${eventId}/registro`);
  return {};
}
