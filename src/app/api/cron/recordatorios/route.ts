import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sendTomorrowReminders } from "@/lib/reminders";

function isAuthorized(request: Request): boolean {
  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expectedSecret || !authHeader) return false;

  const expected = Buffer.from(`Bearer ${expectedSecret}`);
  const received = Buffer.from(authHeader);
  if (expected.length !== received.length) return false;

  return timingSafeEqual(expected, received);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const summary = await sendTomorrowReminders();
  return NextResponse.json(summary);
}
