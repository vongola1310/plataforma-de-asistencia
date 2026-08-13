import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migraciones usan la conexión directa de Neon (sin pooler) porque
    // los locks de advisory y DDL no funcionan de forma confiable a través de PgBouncer.
    url: env("DIRECT_URL"),
  },
});
