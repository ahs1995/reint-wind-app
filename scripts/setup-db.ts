import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Creating tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS actuals (
      start_time TIMESTAMPTZ PRIMARY KEY,
      generation NUMERIC NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS forecasts (
      id SERIAL PRIMARY KEY,
      start_time TIMESTAMPTZ NOT NULL,
      publish_time TIMESTAMPTZ NOT NULL,
      generation NUMERIC NOT NULL
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_forecasts_start
    ON forecasts(start_time)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_forecasts_publish
    ON forecasts(publish_time)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_forecasts_start_publish
    ON forecasts(start_time, publish_time DESC)
  `;

  console.log("Tables created successfully.");
}

main().catch(console.error);
