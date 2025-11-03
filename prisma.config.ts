import path from "node:path";
import { defineConfig, env } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: path.join("prisma"),
  migrations: {
    path: "prisma/migrations",
    seed: `tsx prisma/seed.ts`,
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
