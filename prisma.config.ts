import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Las migraciones deben usar la conexión DIRECTA de Neon (sin pooler): los
 * advisory locks y el DDL no funcionan de forma confiable a través de PgBouncer.
 *
 * No usamos el helper `env()` de Prisma porque lanza al cargar el config, y eso
 * rompería `prisma generate` en el build de Vercel — donde DIRECT_URL no hace
 * falta, porque ahí no se corren migraciones. Caemos a DATABASE_URL para que el
 * build no dependa de una variable que no necesita, avisando si eso ocurre.
 */
function migrationDatasourceUrl(): string {
  const direct = process.env.DIRECT_URL;
  if (direct) return direct;

  const pooled = process.env.DATABASE_URL;
  if (pooled) {
    console.warn(
      "[prisma.config] DIRECT_URL no está definida; usando DATABASE_URL. " +
        "Si vas a correr migraciones, define DIRECT_URL (conexión sin pooler)."
    );
    return pooled;
  }

  return "";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationDatasourceUrl(),
  },
});
