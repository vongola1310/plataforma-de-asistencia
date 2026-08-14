import { addDays, endOfDay, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { sendEventReminderEmail } from "@/lib/email-templates";
import { occupyingWhere } from "@/lib/capacity";

// Zona horaria del showroom. Ajustar si el showroom está en otra región.
const SHOWROOM_TIMEZONE = "America/Mexico_City";

function tomorrowWindowUtc(now: Date) {
  const zonedNow = toZonedTime(now, SHOWROOM_TIMEZONE);
  const zonedTomorrow = addDays(zonedNow, 1);
  const startLocal = startOfDay(zonedTomorrow);
  const endLocal = endOfDay(zonedTomorrow);

  return {
    start: fromZonedTime(startLocal, SHOWROOM_TIMEZONE),
    end: fromZonedTime(endLocal, SHOWROOM_TIMEZONE),
  };
}

export async function sendTomorrowReminders() {
  const { start, end } = tomorrowWindowUtc(new Date());

  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      startsAt: { gte: start, lte: end },
    },
    include: {
      registrations: {
        where: {
          // Solo quienes tienen lugar: los de lista de espera no reciben el
          // recordatorio porque todavía no tienen asistencia asegurada.
          ...occupyingWhere,
          reminderSentAt: null,
        },
      },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const event of events) {
    const results = await Promise.allSettled(
      event.registrations.map(async (registration) => {
        const result = await sendEventReminderEmail(registration, event);
        if (!result.success) throw new Error("send failed");
        await prisma.registration.update({
          where: { id: registration.id },
          data: { reminderSentAt: new Date() },
        });
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") sent += 1;
      else failed += 1;
    }
  }

  return {
    eventsProcessed: events.length,
    sent,
    failed,
  };
}
