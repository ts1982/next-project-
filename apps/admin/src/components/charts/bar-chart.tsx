"use client";

import * as React from "react";

interface BarPoint { label: string; v: number; }

export function BarChart({ data, color = "var(--primary)", height = 160 }: { data: BarPoint[]; color?: string; height?: number; }) {
  const max = Math.max(...data.map((d) => d.v)) || 1;
  return (
    <div className="flex items-end gap-1.5 py-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
          <div className="flex-1 w-full flex items-end">
            <div
              className="w-full rounded-t-[4px] min-h-[2px]"
              style={{
                height: `${(d.v / max) * 100}%`,
                background: `linear-gradient(180deg, ${color}, color-mix(in oklch, ${color} 65%, transparent))`,
              }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground">{d.label}</div>
        </div>
      ))}
    </div>
  );
}
