import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não está definida. Veja o .env.example.");
}

// prepare: false keeps postgres.js compatible with pooled connections (Neon pooler)
export const sql = postgres(connectionString, { max: 5, prepare: false });

export const db = drizzle(sql, { schema });
