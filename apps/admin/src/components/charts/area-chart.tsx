"use client";

import * as React from "react";

interface AreaPoint {
  label: string;
  v: number;
}

interface AreaChartProps {
  data: AreaPoint[];
  color?: string;
  height?: number;
}

export function AreaChart({ data, color = "var(--primary)", height = 200 }: AreaChartProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [w, setW] = React.useState(600);
  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((e) => setW(e[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const padL = 36, padB = 24, padT = 10, padR = 10;
  const cw = Math.max(100, w - padL - padR);
  const ch = height - padT - padB;
  const max = Math.max(...data.map((d) => d.v)) || 1;
  const ticks = 4;
  const step = cw / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => [padL + i * step, padT + ch - (d.v / max) * ch] as const);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
  const area = `${line} L${padL + cw},${padT + ch} L${padL},${padT + ch} Z`;
  const id = React.useId();
  return (
    <div ref={ref} className="w-full">
      <svg width={w} height={height} className="block">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const y = padT + (ch / ticks) * i;
          const v = Math.round(max * (1 - i / ticks));
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={padL + cw} y2={y} stroke="var(--border)" strokeDasharray="2 4" />
              <text x={padL - 8} y={y + 3} fontSize="10" fill="var(--muted-foreground)" textAnchor="end">{v}</text>
            </g>
          );
        })}
        {data.map((d, i) =>
          i % Math.ceil(data.length / 7) === 0 ? (
            <text key={i} x={padL + i * step} y={height - 6} fontSize="10" fill="var(--muted-foreground)" textAnchor="middle">{d.label}</text>
          ) : null,
        )}
        <path d={area} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {pts.length > 0 && (
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill={color} stroke="var(--card)" strokeWidth="2" />
        )}
      </svg>
    </div>
  );
}
