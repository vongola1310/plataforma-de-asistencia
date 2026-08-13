import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFloorPlan, uploadFloorPlan, validateFloorPlanFile } from "@/lib/blob";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  const validationError = validateFloorPlanFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const previous = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  const url = await uploadFloorPlan(file);

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    create: { id: 1, floorPlanImageUrl: url, floorPlanUpdatedAt: new Date() },
    update: { floorPlanImageUrl: url, floorPlanUpdatedAt: new Date() },
  });

  if (previous?.floorPlanImageUrl) {
    await deleteFloorPlan(previous.floorPlanImageUrl);
  }

  return NextResponse.json({ url });
}
