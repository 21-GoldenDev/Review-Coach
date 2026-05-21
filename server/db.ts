import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL must be set. Add it in Vercel → Project → Settings → Environment Variables.",
    );
  }
  return url;
}

function poolNeedsSsl(connectionString: string): boolean {
  if (process.env.PGSSLMODE === "require") return true;
  if (/sslmode=require/i.test(connectionString)) return true;
  if (/neon\.tech|supabase\.co|render\.com|railway\.app/i.test(connectionString)) {
    return true;
  }
  return !!(process.env.VERCEL && process.env.NODE_ENV === "production");
}

const connectionString = getDatabaseUrl();

export const pool = new Pool({
  connectionString,
  ssl: poolNeedsSsl(connectionString)
    ? { rejectUnauthorized: false }
    : undefined,
});

export const db = drizzle(pool, { schema });
