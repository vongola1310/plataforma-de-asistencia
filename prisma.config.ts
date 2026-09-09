import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Conexión DIRECTA de Neon (sin pooler). Las migraciones la necesitan porque
 * los advisory locks y el DDL no funcionan de forma confiable a través de
 * PgBouncer; `prisma generate` no necesita ninguna, solo lee el schema.
 *
 * Por eso el datasource se declara únicamente cuando la variable existe: con
 * `env("DIRECT_URL")` la config reventaba al cargarse, así que un entorno sin
 * DIRECT_URL (el `postinstall` de un build, por ejemplo) no podía ni generar
 * el cliente. El propio tipo de Prisma lo marca como opcional: "required for
 * migration / introspection commands".
 */
const directUrl = process.env.DIRECT_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  ...(directUrl ? { datasource: { url: directUrl } } : {}),
});
