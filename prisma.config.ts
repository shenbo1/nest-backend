import path from "path";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma"),
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
