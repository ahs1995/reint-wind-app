"use client";

import { useState, useEffect, useCallback } from "react";
import { formatInTimeZone } from "date-fns-tz";
import WindChart from "@/components/WindChart";
import TimeRangeInputs from "@/components/TimeRangeInputs";
import { Slider } from "@/components/ui/slider";

const UTC = "UTC";

interface ChartPoint {
  time: string;
  actual: number | null;
  forecast: number | null;
}

interface ApiResponse {
  actuals: { start_time: string; generation: string | number }[];
  forecasts: {
    start_time: string;
    publish_time: string;
    generation: string | number;
  }[];
}

function mergeData(res: ApiResponse): ChartPoint[] {
  const map = new Map<string, ChartPoint>();

  for (const a of res.actuals) {
    map.set(a.start_time, {
      time: a.start_time,
      actual: parseFloat(a.generation as any),
      forecast: null,
    });
  }

  for (const f of res.forecasts) {
    const existing = map.get(f.start_time);
    if (existing) {
      existing.forecast = parseFloat(f.generation as any);
    } else {
      map.set(f.start_time, {
        time: f.start_time,
        actual: null,
        forecast: parseFloat(f.generation as any),
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.time.localeCompare(b.time));
}

export default function Home() {
  const [startTime, setStartTime] = useState<Date>(
    new Date("2024-01-01T00:00:00Z"),
  );
  const [endTime, setEndTime] = useState<Date>(
    new Date("2024-01-07T23:30:00Z"),
  );
  const [horizon, setHorizon] = useState(4);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const start = formatInTimeZone(
        startTime,
        UTC,
        "yyyy-MM-dd'T'HH:mm:ss'Z'",
      );
      const end = formatInTimeZone(endTime, UTC, "yyyy-MM-dd'T'HH:mm:ss'Z'");

      const res = await fetch(
        `/api/chart-data?start=${start}&end=${end}&horizon=${horizon}`,
      );

      if (!res.ok) throw new Error("Failed to fetch data");

      const json: ApiResponse = await res.json();
      setChartData(mergeData(json));
    } catch (err) {
      setError("Failed to load chart data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startTime, endTime, horizon]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            UK Wind Power Forecast Monitor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comparing actual and forecasted wind generation — January 2024
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 p-4 border rounded-lg bg-card">
          {/* Time range inputs */}
          <TimeRangeInputs
            startTime={startTime}
            endTime={endTime}
            onStartChange={setStartTime}
            onEndChange={setEndTime}
          />

          {/* Horizon slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Forecast Horizon</label>
              <span className="text-sm text-muted-foreground">{horizon}h</span>
            </div>
            <Slider
              min={0}
              max={48}
              step={1}
              value={[horizon]}
              onValueChange={([val]) => setHorizon(val)}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 hrs</span>
              <span>48 hrs</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="border rounded-lg bg-card p-4">
          {error ? (
            <div className="flex items-center justify-center h-96 text-destructive text-sm">
              {error}
            </div>
          ) : (
            <WindChart data={chartData} loading={loading} />
          )}
        </div>

        {/* Stats strip */}
        {!loading && chartData.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="border rounded-lg p-4 bg-card text-center">
              <p className="text-xs text-muted-foreground">Data points</p>
              <p className="text-xl font-semibold mt-1">{chartData.length}</p>
            </div>
            <div className="border rounded-lg p-4 bg-card text-center">
              <p className="text-xs text-muted-foreground">With forecast</p>
              <p className="text-xl font-semibold mt-1">
                {chartData.filter((d) => d.forecast != null).length}
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-card text-center">
              <p className="text-xs text-muted-foreground">Missing forecast</p>
              <p className="text-xl font-semibold mt-1">
                {chartData.filter((d) => d.forecast == null).length}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
