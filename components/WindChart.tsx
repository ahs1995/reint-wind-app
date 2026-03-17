"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const UTC = "UTC";

interface ChartPoint {
  time: string;
  actual: number | null;
  forecast: number | null;
}

interface Props {
  data: ChartPoint[];
  loading: boolean;
}

export default function WindChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground text-sm">
        Loading chart data...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground text-sm">
        No data for selected range
      </div>
    );
  }

  return (
    <div>
      {/* Manual legend above the chart */}
      <div className="flex items-center justify-center gap-6 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-blue-500" />
          <span className="text-sm text-muted-foreground">
            Actual generation
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 border-t-2 border-dashed border-green-500" />
          <span className="text-sm text-muted-foreground">Forecast</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            tickFormatter={(val) => format(parseISO(val), "dd/MM HH:mm")}
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={60}
            height={60}
            label={{
              value: "Target time (UTC)",
              position: "insideBottom",
              offset: -10,
              style: {
                fontSize: 14,
                fill: "#6b7280",
                fontWeight: 600,
              },
            }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(val) => `${val}`}
            width={80}
            label={{
              value: "Power (MW)",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              style: { fontSize: 12, fill: "#6b7280", fontWeight: 600 },
            }}
          />
          <Tooltip
            labelFormatter={(label) =>
              formatInTimeZone(
                new Date(label as string),
                UTC,
                "dd MMM yyyy HH:mm",
              ) + " UTC"
            }
            formatter={(value: number | null, name: string) => [
              value != null ? `${value.toFixed(0)} MW` : "No data",
              name === "actual" ? "Actual generation" : "Forecast",
            ]}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            dot={false}
            strokeWidth={2}
            connectNulls={false}
            name="actual"
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#22c55e"
            dot={false}
            strokeWidth={2}
            connectNulls={true}
            name="forecast"
            strokeDasharray="5 5"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
