"use client";

import { useState } from "react";
import { useTooltip } from "@/components/Tooltip";
import { fmt } from "@/lib/format";

interface Props {
  months: string[];
  prevMonths: string[];
  cur: number[];
  prev: number[];
  unit: string;
  decimals: number;
  ariaLabel: string;
}

const X0 = 52;
const X1 = 892;
const TOP = 16;
const BASE = 150;

/** 전년 동기 비교 — 실선(올해) + 점선(작년)을 한 차트에 겹쳐 그린다 */
export default function YoyChart({ months, prevMonths, cur, prev, unit, decimals, ariaLabel }: Props) {
  const { show, hide } = useTooltip();
  const [hover, setHover] = useState<number | null>(null);

  const txt = (v: number) => (decimals === 0 ? fmt(Math.round(v)) : v.toFixed(decimals)) + unit;

  const all = [...cur, ...prev];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const lo = Math.max(0, min - (max - min) * 0.15);
  const hi = max + (max - min) * 0.12;

  const last = months.length - 1;
  const step = (X1 - X0 - 32) / last;
  const xs = months.map((_, i) => X0 + 16 + i * step);
  const y = (v: number) => BASE - ((v - lo) / (hi - lo || 1)) * (BASE - TOP);

  const curLine = cur.map((v, i) => `${xs[i].toFixed(1)},${y(v).toFixed(1)}`).join(" L");
  const prevLine = prev.map((v, i) => `${xs[i].toFixed(1)},${y(v).toFixed(1)}`).join(" L");
  const ticks = [lo, (lo + hi) / 2, hi];

  return (
    <svg
      viewBox="0 0 900 176"
      role="img"
      aria-label={ariaLabel}
      onMouseLeave={() => {
        setHover(null);
        hide();
      }}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={X0} y1={y(t)} x2={X1} y2={y(t)} stroke="var(--grid)" strokeWidth={1} />
          <text x={X0 - 8} y={y(t) + 4} fontSize={12} fill="var(--muted)" textAnchor="end" className="mono">
            {txt(t)}
          </text>
        </g>
      ))}

      <path d={`M${prevLine}`} fill="none" stroke="var(--muted)" strokeWidth={1.6} strokeDasharray="5 4" />
      <path d={`M${curLine}`} fill="none" stroke="var(--navy)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[last]} cy={y(cur[last])} r={5} fill="var(--card)" stroke="var(--navy)" strokeWidth={3} />

      {hover !== null && (
        <g>
          <line x1={xs[hover]} y1={TOP - 6} x2={xs[hover]} y2={BASE} stroke="var(--navy)" strokeWidth={1.2} strokeDasharray="4 3" />
          <circle cx={xs[hover]} cy={y(cur[hover])} r={4.5} fill="var(--navy)" />
          <circle cx={xs[hover]} cy={y(prev[hover])} r={4.5} fill="var(--muted)" />
        </g>
      )}

      {[0, Math.floor(last / 2), last].map((i, k) => (
        <text
          key={i}
          x={xs[i]}
          y={168}
          fontSize={12}
          fill="var(--muted)"
          textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}
          className="mono"
        >
          {months[i]}
        </text>
      ))}

      <g>
        {months.map((mo, i) => {
          const left = i === 0 ? X0 : (xs[i - 1] + xs[i]) / 2;
          const right = i === last ? X1 : (xs[i] + xs[i + 1]) / 2;
          return (
            <rect
              key={mo}
              x={left}
              y={TOP - 6}
              width={right - left}
              height={BASE - TOP + 6}
              fill="transparent"
              onMouseMove={(ev) => {
                setHover(i);
                show(
                  <>
                    <div className="tt">
                      {mo} / {prevMonths[i]}
                    </div>
                    <div className="tr">
                      <i className="sw" style={{ background: "var(--navy)" }} />
                      올해 <b>{txt(cur[i])}</b>
                    </div>
                    <div className="tr">
                      <i className="sw" style={{ background: "var(--muted)" }} />
                      작년 <b>{txt(prev[i])}</b>
                    </div>
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
