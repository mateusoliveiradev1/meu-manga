import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile?.(".env");
} catch {
  /* .env opcional */
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
});
