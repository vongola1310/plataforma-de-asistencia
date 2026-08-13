import { put, del } from "@vercel/blob";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function validateFloorPlanFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Formato no soportado. Usa PNG, JPG o WEBP.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "El archivo supera el tamaño máximo de 5MB.";
  }
  return null;
}

export async function uploadFloorPlan(file: File) {
  const blob = await put(`croquis/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function deleteFloorPlan(url: string) {
  try {
    await del(url);
  } catch {
    // Si ya no existe o falla el borrado, no bloqueamos el flujo.
  }
}
