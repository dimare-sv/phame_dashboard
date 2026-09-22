"use client";

import { useState } from "react";
import Card from "@/components/Card";
import { useTooltip } from "@/components/Tooltip";
import { fmt } from "@/lib/format";
import type { FunnelStage } from "@/lib/data/types";

/**
 * 가로로 좁아지는 진짜 깔때기 모양.
 *
 * 예전엔 단계마다 "값 → 막대"를 세로로 쌓았는데, 카드 폭이 넓어질수록 막대
 * 하나가 가로로 쭉 늘어나기만 해서 내용이 없어 보였다(2026-09-22 피드백) —
 * 4단계를 가로로 나란히 놓고 값 비율만큼 높이가 줄어드는 다각형을 이어 붙이면
 * 카드가 넓을수록 깔때기가 더 커 보일 뿐 빈 느낌이 없다.
 */
const RAMP = ["#a7c6ea", "#7aa3d8", "#4c78bb", "#1b4c8f"];

const X0 = 46;
const X1 = 854;
const MAX_H = 150;
const TOP_MARGIN = 50;
const CY = TOP_MARGIN + MAX_H / 2;
const FOOT_Y = TOP_MARGIN + MAX_H + 30;
const VIEW_H = FOOT_Y + 28;

export default function FunnelCard({
  stages,
  periodLabel,
  title = "결제 퍼널",
  footnote,
}: {
  stages: FunnelStage[];
  periodLabel: string;
  title?: string;
  /** 표 아래 한 줄 해설. <b> 허용 */
  footnote?: string;
}) {
  const { show, hide } = useTooltip();
  const [hover, setHover] = useState<number | null>(null);

  const n = stages.length;
  const top = stages[0].value;
  const segW = (X1 - X0) / n;
  const h = (v: number) => (v / top) * MAX_H;
  const steps = stages.slice(0, -1).map((s, i) => (stages[i + 1].value / s.value) * 100);
  /* 가장 많이 빠지는 구간 하나만 강조한다 — 전부 칠하면 어디를 볼지 알 수 없다 */
  const worst = steps.indexOf(Math.min(...steps));
  const endToEnd = (stages[n - 1].value / top) * 100;

  return (
    <Card title={title} note={periodLabel}>
      <div className="chart-wrap fn2-wrap">
        <svg
          viewBox={`0 0 900 ${VIEW_H}`}
          role="img"
          aria-label={`${title} · 단계별 이탈`}
          onMouseLeave={() => {
            setHover(null);
            hide();
          }}
        >
          {stages.map((s, i) => {
            const leftH = h(s.value);
            const rightH = i < n - 1 ? h(stages[i + 1].value) : leftH;
            const x0 = X0 + i * segW;
            const x1 = x0 + segW;
            const cx = x0 + segW / 2;
            const pct = (s.value / top) * 100;
            const pts = [
              `${x0.toFixed(1)},${(CY - leftH / 2).toFixed(1)}`,
              `${x1.toFixed(1)},${(CY - rightH / 2).toFixed(1)}`,
              `${x1.toFixed(1)},${(CY + rightH / 2).toFixed(1)}`,
              `${x0.toFixed(1)},${(CY + leftH / 2).toFixed(1)}`,
            ].join(" ");
            return (
              <g
                key={s.event}
                onMouseMove={(ev) => {
                  setHover(i);
                  show(
                    <>
                      <div className="tt">{s.name}</div>
                      <div className="tv">{fmt(s.value)}</div>
                      <div className="tt" style={{ marginTop: 3 }}>
                        최상단 대비 {pct.toFixed(1)}%
                      </div>
                    </>,
                    ev,
                  );
                }}
              >
                <polygon
                  points={pts}
                  fill={RAMP[i % RAMP.length]}
                  opacity={hover === null || hover === i ? 1 : 0.55}
                />
                <text x={cx} y={16} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--ink-2)">
                  {s.name}
                </text>
                <text
                  x={cx}
                  y={37}
                  textAnchor="middle"
                  fontSize={18}
                  fontWeight={700}
                  fill="var(--ink)"
                  className="num"
                >
                  {fmt(s.value)}
                </text>
                <text x={cx} y={52} textAnchor="middle" fontSize={11} fill="var(--faint)" className="mono">
                  {s.event}
                </text>
              </g>
            );
          })}

          {/* 단계 사이 경계 — 이 폭이 곧 다음 단계로 넘어간 비율이다 */}
          {steps.map((pct, i) => {
            const bx = X0 + (i + 1) * segW;
            return (
              <g key={i}>
                <line
                  x1={bx}
                  y1={TOP_MARGIN - 4}
                  x2={bx}
                  y2={TOP_MARGIN + MAX_H + 4}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
                <text
                  x={bx}
                  y={FOOT_Y}
                  textAnchor="middle"
                  fontSize={12.5}
                  fontWeight={700}
                  fill={i === worst ? "var(--warn)" : "var(--muted)"}
                >
                  ↓ {pct.toFixed(1)}%{i === worst ? " · 최대 이탈" : ""}
                </text>
                {/* avgTime 은 "도착한" 단계(stages[i+1])에 붙어 있다 — 다음 단계로 넘어가는 데 걸린 시간이라서다 */}
                {stages[i + 1].avgTime && (
                  <text x={bx} y={FOOT_Y + 15} textAnchor="middle" fontSize={11} fill="var(--faint)">
                    평균 {stages[i + 1].avgTime} 소요
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="fn-foot">
        <span>전체 전환율</span>
        <b className="num">{endToEnd.toFixed(1)}%</b>
      </div>
      {footnote && (
        <p className="mv-note" style={{ margin: "0 18px 16px" }} dangerouslySetInnerHTML={{ __html: footnote }} />
      )}
    </Card>
  );
}
