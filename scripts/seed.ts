import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const BASE = "https://data.elexon.co.uk/bmrs/api/v1";

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toISO(date: Date): string {
  return date.toISOString();
}

//fetch actuals
async function fetchActualsForDay(dayStart: Date): Promise<any[]> {
  const dayEnd = addDays(dayStart, 1);

  const url = new URL(`${BASE}/datasets/FUELHH`);
  url.searchParams.set("publishDateTimeFrom", toISO(dayStart));
  url.searchParams.set("publishDateTimeTo", toISO(dayEnd));
  url.searchParams.set("fuelType", "WIND");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok)
    throw new Error(`FUELHH fetch failed: ${res.status} ${await res.text()}`);

  const data = await res.json();
  return Array.isArray(data) ? data : (data?.data ?? []);
}

//fetch forcasts
async function fetchForecastsForDay(dayStart: Date): Promise<any[]> {
  const dayEnd = addDays(dayStart, 1);

  const url = new URL(`${BASE}/datasets/WINDFOR/stream`);
  url.searchParams.set("publishDateTimeFrom", toISO(dayStart));
  url.searchParams.set("publishDateTimeTo", toISO(dayEnd));

  const res = await fetch(url.toString());
  if (!res.ok)
    throw new Error(`WINDFOR fetch failed: ${res.status} ${await res.text()}`);

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

//insert actuals
async function insertActuals(records: any[]): Promise<number> {
  let inserted = 0;
  for (const r of records) {
    if (!r.startTime || r.generation == null) continue;
    await sql`
      INSERT INTO actuals (start_time, generation)
      VALUES (${r.startTime}, ${r.generation})
      ON CONFLICT (start_time) DO NOTHING
    `;
    inserted++;
  }
  return inserted;
}

//insert forecasts
const JAN_START = new Date("2024-01-01T00:00:00Z");
const JAN_END = new Date("2024-02-01T00:00:00Z");

async function insertForecasts(records: any[]): Promise<number> {
  let inserted = 0;
  for (const r of records) {
    if (!r.startTime || !r.publishTime || r.generation == null) continue;

    const startMs = new Date(r.startTime).getTime();
    const publishMs = new Date(r.publishTime).getTime();

    // Only keep forecasts whose TARGET slot is in January 2024
    if (startMs < JAN_START.getTime() || startMs >= JAN_END.getTime()) continue;

    // Only keep 0–48 hr horizon (publishTime must be BEFORE startTime)
    const horizonHrs = (startMs - publishMs) / (1000 * 60 * 60);
    if (horizonHrs < 0 || horizonHrs > 48) continue;

    await sql`
      INSERT INTO forecasts (start_time, publish_time, generation)
      VALUES (${r.startTime}, ${r.publishTime}, ${r.generation})
    `;
    inserted++;
  }
  return inserted;
}

// ─── MAIN ─────────────────────────────────────────────────────────
async function main() {
  console.log("Seeding actuals (FUELHH)...");
  let totalActuals = 0;
  let current = new Date("2024-01-01T00:00:00Z");
  const actualsEnd = new Date("2024-02-01T00:00:00Z");

  while (current < actualsEnd) {
    const dateStr = current.toISOString().split("T")[0];
    const records = await fetchActualsForDay(current);
    const count = await insertActuals(records);
    console.log(`  ${dateStr}: fetched ${records.length}, inserted ${count}`);
    totalActuals += count;
    current = addDays(current, 1);
  }
  console.log(`Actuals done: ${totalActuals} total rows`);

  console.log("Seeding forecasts (WINDFOR)...");
  let totalForecasts = 0;
  current = new Date("2023-12-30T00:00:00Z"); // 48hrs before Jan 1
  const forecastsEnd = new Date("2024-01-31T00:00:00Z");

  while (current < forecastsEnd) {
    const dateStr = current.toISOString().split("T")[0];
    const records = await fetchForecastsForDay(current);
    const count = await insertForecasts(records);
    console.log(`  ${dateStr}: fetched ${records.length}, kept ${count}`);
    totalForecasts += count;
    current = addDays(current, 1);
  }
  console.log(`Forecasts done: ${totalForecasts} total rows`);

  console.log("Verification:");
  const [{ count: ac }] = await sql`SELECT COUNT(*) as count FROM actuals`;
  const [{ count: fc }] = await sql`SELECT COUNT(*) as count FROM forecasts`;
  const [minmax] =
    await sql`SELECT MIN(start_time), MAX(start_time) FROM actuals`;

  console.log(`  Actuals : ${ac} rows`);
  console.log(`  Forecasts: ${fc} rows`);
  console.log(`  Actuals range: ${minmax.min} → ${minmax.max}`);
}

main().catch(console.error);
