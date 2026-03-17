import sql from "./db";

export interface ActualPoint {
  start_time: string;
  generation: number;
}

export interface ForecastPoint {
  start_time: string;
  publish_time: string;
  generation: number;
}

export interface ChartData {
  actuals: ActualPoint[];
  forecasts: ForecastPoint[];
}

export async function getChartData(
  startTime: string,
  endTime: string,
  horizonHours: number,
): Promise<ChartData> {
  // Fetch actuals in range
  const actuals = await sql`
    SELECT start_time, generation
    FROM actuals
    WHERE start_time >= ${startTime}
      AND start_time <= ${endTime}
    ORDER BY start_time ASC
  `;

  // THE core query:
  // For each start_time slot, get the latest forecast
  // published at least horizonHours before that slot.
  // DISTINCT ON picks one row per start_time,
  // and ORDER BY publish_time DESC ensures it picks the most recent valid one.
  const forecasts = await sql`
    SELECT DISTINCT ON (start_time)
      start_time,
      publish_time,
      generation
    FROM forecasts
    WHERE start_time >= ${startTime}
      AND start_time <= ${endTime}
      AND publish_time <= start_time - (${horizonHours} * INTERVAL '1 hour')
    ORDER BY start_time, publish_time DESC
  `;

  return {
    actuals: actuals as ActualPoint[],
    forecasts: forecasts as ForecastPoint[],
  };
}
