"use client";

import { useState } from "react";
import { useTooltip } from "@/components/Tooltip";
import { fmt } from "@/lib/format";
import type { WauPoint } from "@/lib/data/types";

const X0 = 52;
const X1 = 892;
const TOP = 20;
const BASE = 148;

const kfmt = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}K` : String(n));

/** 축을 1,000 단위 눈금에 맞춰 떨어지게 잡는다 — 8K / 10K / 12K 처럼 읽히도록 */
function domain(values: number[]): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const unit = 1000;
  const lo = Math.floor((min - (max - min) * 0.2) / unit) * unit;
  const hi = Math.ceil((max + (max - min) * 0.12) / unit) * unit;
  return [lo, hi];
}

export default function WauTrendChart({ points }: { points: WauPoint[] }) {
  const { show, hide } = useTooltip();
  const [hover, setHover] = useState<number | null>(null);

  const [lo, hi] = domain(points.map((p) => p.value));
  const step = (X1 - X0 - 32) / (points.length - 1);
  const xs = points.map((_, i) => X0 + 16 + i * step);
  const y = (v: number) => BASE - ((v - lo) / (hi - lo)) * (BASE - TOP);

  const line = points.map((p, i) => `${xs[i].toFixed(1)},${y(p.value).toFixed(1)}`);
  const ticks = [lo, (lo + hi) / 2, hi];
  const last = points.length - 1;

  return (
    <svg
      viewBox="0 0 900 182"
      role="img"
      aria-label={`WAU ${points.length}주 추이 — ${fmt(points[0].value)}명에서 ${fmt(points[last].value)}명`}
      onMouseLeave={() => {
        setHover(null);
        hide();
      }}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={X0} y1={y(t)} x2={X1} y2={y(t)} stroke="var(--grid)" strokeWidth={1} />
          <text
            x={X0 - 8}
            y={y(t) + 4}
            fontSize={12}
            fill="var(--muted)"
            textAnchor="end"
            className="mono"
          >
            {kfmt(t)}
          </text>
        </g>
      ))}

      <path
        d={`M${line.join(" L")} L${xs[last].toFixed(1)},${BASE} L${xs[0].toFixed(1)},${BASE} Z`}
        fill="var(--s-keep)"
        opacity={0.1}
      />
      <polyline
        points={line.join(" ")}
        fill="none"
        stroke="var(--s-keep)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={xs[last]}
        cy={y(points[last].value)}
        r={5}
        fill="var(--card)"
        stroke="var(--s-keep)"
        strokeWidth={3}
      />

      {hover !== null && (
        <g>
          <line
            x1={xs[hover]}
            y1={TOP - 6}
            x2={xs[hover]}
            y2={BASE}
            stroke="var(--s-keep)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <circle cx={xs[hover]} cy={y(points[hover].value)} r={5} fill="var(--s-keep)" />
        </g>
      )}

      {[0, Math.floor(last / 2), last].map((i, k) => (
        <text
          key={i}
          x={xs[i]}
          y={174}
          fontSize={12}
          fill="var(--muted)"
          textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}
          className="mono"
        >
          {points[i].week}
        </text>
      ))}

      {/* 마우스를 정확히 선 위에 올리지 않아도 잡히도록, 구간 전체를 히트존으로 둔다 */}
      <g>
        {points.map((p, i) => {
          const left = i === 0 ? X0 : (xs[i - 1] + xs[i]) / 2;
          const right = i === last ? X1 : (xs[i] + xs[i + 1]) / 2;
          const prev = i > 0 ? points[i - 1].value : null;
          const diff = prev ? (((p.value - prev) / prev) * 100).toFixed(1) : null;
          return (
            <rect
              key={p.week}
              x={left}
              y={TOP - 6}
              width={right - left}
              height={BASE - TOP + 6}
              fill="transparent"
              onMouseMove={(ev) => {
                setHover(i);
                show(
                  <>
                    <div className="tt">{p.week} 주</div>
                    <div className="tv">{fmt(p.value)}</div>
                    {diff !== null && (
                      <div className="tt" style={{ marginTop: 3 }}>
                        직전 주 대비 {Number(diff) >= 0 ? "+" : ""}
                        {diff}%
                      </div>
                    )}
                  </>,
                  ev,
                );
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}
