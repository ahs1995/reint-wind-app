import { NextRequest, NextResponse } from "next/server";
import { getChartData } from "@/lib/forecast";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const horizon = Number(searchParams.get("horizon") ?? "4");

  if (!start || !end) {
    return NextResponse.json(
      { error: "start and end are required" },
      { status: 400 },
    );
  }

  if (isNaN(horizon) || horizon < 0 || horizon > 48) {
    return NextResponse.json(
      { error: "horizon must be between 0 and 48" },
      { status: 400 },
    );
  }

  try {
    const data = await getChartData(start, end, horizon);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Chart data error:", err);
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 },
    );
  }
}
