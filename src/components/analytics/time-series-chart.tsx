"use client";

import { useId, useState } from "react";

export function TimeSeriesChart({ data }: { data: { date: string; views: number; clicks: number }[] }) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const width = 640;
  const height = 200;
  const padding = 24;
  const max = Math.max(1, ...data.map((d) => Math.max(d.views, d.clicks)));

  const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;

  function toPoints(key: "views" | "clicks") {
    return data.map((d, i) => {
      const x = padding + i * stepX;
      const y = height - padding - (d[key] / max) * (height - padding * 2);
      return `${x},${y}`;
    });
  }

  const viewsLine = toPoints("views").join(" ");
  const clicksLine = toPoints("clicks").join(" ");

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Views and clicks over time">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64A0FF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#64A0FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`${padding},${height - padding} ${viewsLine} ${width - padding},${height - padding}`} fill={`url(#${gradientId})`} />
        <polyline points={viewsLine} fill="none" stroke="#64A0FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={clicksLine} fill="none" stroke="#B998FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" />
        {data.map((d, i) => (
          <rect
            key={d.date}
            x={padding + i * stepX - stepX / 2}
            y={0}
            width={stepX || width}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      <div className="mt-3 flex items-center gap-4 text-xs text-alloy-dim">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-electric" /> Views
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-ultraviolet" /> Clicks
        </span>
        {hover !== null && data[hover] && (
          <span className="ml-auto font-mono text-alloy">
            {data[hover].date} · {data[hover].views} views · {data[hover].clicks} clicks
          </span>
        )}
      </div>
    </div>
  );
}
