"use client";

import { formatInTimeZone } from "date-fns-tz";

interface Props {
  startTime: Date;
  endTime: Date;
  onStartChange: (date: Date) => void;
  onEndChange: (date: Date) => void;
}

const UTC = "UTC";

export default function TimeRangeInputs({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
}: Props) {
  const toInputValue = (date: Date) =>
    formatInTimeZone(date, UTC, "yyyy-MM-dd'T'HH:mm");

  const handleStart = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    onStartChange(new Date(e.target.value + "Z"));
  };

  const handleEnd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    onEndChange(new Date(e.target.value + "Z"));
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-sm font-medium">Start Time</label>
        <input
          type="datetime-local"
          value={toInputValue(startTime)}
          onChange={handleStart}
          min="2024-01-01T00:00"
          max="2024-01-31T23:30"
          className="border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-sm font-medium">End Time</label>
        <input
          type="datetime-local"
          value={toInputValue(endTime)}
          onChange={handleEnd}
          min="2024-01-01T00:00"
          max="2024-01-31T23:30"
          className="border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}
