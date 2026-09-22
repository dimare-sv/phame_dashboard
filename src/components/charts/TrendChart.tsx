"use client";

import { useState } from "react";
import { useTooltip } from "@/components/Tooltip";
import { fmt } from "@/lib/format";

interface Props {
  series: number[];
  /** 직전 기간의 같은 길이 궤적 — 있으면 연한 점선으로 겹쳐 그린다 */
  prevSeries?: number[];
  /** 겹친 선의 범례 문구 — "직전 7일" */
  prevLabel?: string;
  /** 좌 / 중 / 우 3개만 찍는다 — 12개를 다 찍으면 읽히지 않는다 */
  labels: [string, string, string];
  unit: string;
  decimals: number;
  /** bar 는 0을 바닥으로, line 은 데이터 범위에 맞춘 축을 쓴다 */
  kind: "bar" | "line";
  ariaLabel: string;
}

const X0 = 62;
const X1 = 884;
const BASE = 156;
const TOP = 16;

export default function TrendChart({
  series,
  prevSeries,
  prevLabel,
  labels,
  unit,
  decimals,
  kind,
  ariaLabel,
}: Props) {
  const { show, hide } = useTooltip();
  const [hover, setHover] = useState<number | null>(null);

  const last = series.length - 1;
  const txt = (v: number) => (decimals === 0 ? fmt(Math.round(v)) : v.toFixed(decimals)) + unit;

  /* 겹친 직전 기간 선도 같은 축에 들어와야 잘리지 않는다 */
  const all = prevSeries && prevSeries.length === series.length ? [...series, ...prevSeries] : series;
  /* 막대는 반드시 0에서 시작한다. 선은 값의 범위를 조금 넓혀 잡는다. */
  const lo = kind === "bar" ? 0 : Math.min(...all) - (Math.max(...all) - Math.min(...all)) * 0.6;
  const rawHi =
    kind === "bar"
      ? Math.max(...all) * 1.12
      : Math.max(...all) + (Math.max(...all) - Math.min(...all)) * 0.3;
  /* 비율 축에 100%를 넘는 눈금을 찍지 않는다 */
  const hi = unit === "%" ? Math.min(rawHi, 100) : rawHi;

  const y = (v: number) => BASE - ((v - lo) / (hi - lo || 1)) * (BASE - TOP);
  const slot = (X1 - X0) / series.length;
  const cx = (i: number) => X0 + i * slot + slot / 2;
  const bw = Math.min(slot - 10, 46);

  const line = series.map((v, i) => `${cx(i).toFixed(1)},${y(v).toFixed(1)}`);
  const hasPrev = prevSeries && prevSeries.length === series.length;
  const prevLine = hasPrev ? prevSeries!.map((v, i) => `${cx(i).toFixed(1)},${y(v).toFixed(1)}`) : null;

  return (
    <svg
      viewBox="0 0 900 196"
      role="img"
      aria-label={ariaLabel}
      onMouseLeave={() => {
        setHover(null);
        hide();
      }}
    >
      {[0, 0.5, 1].map((f) => {
        const v = lo + (hi - lo) * f;
        return (
          <g key={f}>
            <line x1={X0} y1={y(v)} x2={X1} y2={y(v)} stroke="var(--grid)" strokeWidth={1} />
            <text
              x={X0 - 8}
              y={y(v) + 4}
              fontSize={12}
              fill="var(--muted)"
              textAnchor="end"
              className="mono"
            >
              {txt(v)}
            </text>
          </g>
        );
      })}

      {kind === "line" && (
        <>
          <path
            d={`M${line.join(" L")} L${cx(last).toFixed(1)},${BASE} L${cx(0).toFixed(1)},${BASE} Z`}
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
            cx={cx(last)}
            cy={y(series[last])}
            r={5}
            fill="var(--card)"
            stroke="var(--navy)"
            strokeWidth={3}
          />
          {hover !== null && <circle cx={cx(hover)} cy={y(series[hover])} r={5} fill="var(--s-keep)" />}
        </>
      )}

      {kind === "bar" &&
        series.map((v, i) => (
          <rect
            key={i}
            x={cx(i) - bw / 2}
            y={y(v)}
            width={bw}
            height={BASE - y(v)}
            rx={3}
            /* 마지막 막대만 네이비로 — 지금 보고 있는 기간이 어디인지 표시 */
            fill={i === last ? "var(--navy)" : "var(--s-keep)"}
            opacity={i === last ? 1 : 0.72}
          />
        ))}

      {/* 직전 기간 궤적 — 숫자(vp)로만 보던 전기 대비를 같은 차트 위에서 비교한다 */}
      {hasPrev && (
        <>
          <polyline
            points={prevLine!.join(" ")}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={1.75}
            strokeDasharray="5 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.75}
          />
          <g className="mono" fontSize={11.5}>
            <line x1={X1 - 82} y1={9} x2={X1 - 68} y2={9} stroke="var(--s-keep)" strokeWidth={2.5} />
            <text x={X1 - 62} y={12.5} fill="var(--muted)">
              이번 기간
            </text>
            <line
              x1={X1 - 82}
              y1={22}
              x2={X1 - 68}
              y2={22}
              stroke="var(--muted)"
              strokeWidth={1.75}
              strokeDasharray="5 4"
              opacity={0.75}
            />
            <text x={X1 - 62} y={25.5} fill="var(--muted)">
              {prevLabel ?? "직전 기간"}
            </text>
          </g>
        </>
      )}

      <line x1={X0} y1={BASE} x2={X1} y2={BASE} stroke="var(--line)" strokeWidth={1} />

      {[0, Math.floor(last / 2), last].map((i, k) => (
        <text
          key={i}
          x={cx(i)}
          y={BASE + 26}
          fontSize={12}
          fill="var(--muted)"
          textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}
          className="mono"
        >
          {labels[k]}
        </text>
      ))}

      {/* 막대 위가 아니라 구간 전체를 잡는다 — 낮은 막대도 쉽게 맞도록 */}
      {series.map((v, i) => {
        const prev = i > 0 ? series[i - 1] : null;
        const diff = prev ? (((v - prev) / prev) * 100).toFixed(1) : null;
        return (
          <rect
            key={`hit${i}`}
            x={X0 + i * slot}
            y={TOP - 8}
            width={slot}
            height={BASE - TOP + 8}
            fill="transparent"
            onMouseMove={(ev) => {
              setHover(i);
              show(
                <>
                  <div className="tv">{txt(v)}</div>
                  {diff !== null && (
                    <div className="tt" style={{ marginTop: 3 }}>
                      직전 구간 대비 {Number(diff) >= 0 ? "+" : ""}
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
    </svg>
  );
}
