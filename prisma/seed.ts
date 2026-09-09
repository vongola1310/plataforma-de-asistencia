import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@showroom.com";
  const name = process.env.SEED_ADMIN_NAME ?? "Administrador";
  const configuredPassword = process.env.SEED_ADMIN_PASSWORD;

  // Una contraseña de ejemplo en producción es una puerta abierta al panel:
  // mejor fallar el seed que crear el administrador con algo conocido.
  if (!configuredPassword && process.env.NODE_ENV === "production") {
    throw new Error(
      "Define SEED_ADMIN_PASSWORD para crear el administrador en producción."
    );
  }

  const password = configuredPassword ?? "changeme123";

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash },
  });

  console.log(`Admin listo: ${admin.email}`);
  if (!configuredPassword) {
    console.log(
      `Contraseña temporal: "${password}" — cámbiala después de tu primer inicio de sesión.`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
