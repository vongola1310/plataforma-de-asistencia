import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CroquisUploader } from "@/components/admin/CroquisUploader";

export default async function AdminCroquisPage() {
  const siteSettings = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Croquis del showroom</h1>
      <Card>
        <CardHeader>
          <CardTitle>Imagen actual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {siteSettings?.floorPlanImageUrl ? (
            <Image
              src={siteSettings.floorPlanImageUrl}
              alt="Croquis de las instalaciones del showroom"
              width={800}
              height={600}
              className="h-auto w-full rounded-md border"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no se ha subido un croquis.
            </p>
          )}
          <CroquisUploader />
        </CardContent>
      </Card>
    </div>
  );
}
