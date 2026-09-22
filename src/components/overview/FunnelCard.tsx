"use client";

import { useState } from "react";
import Card from "@/components/Card";
import { useTooltip } from "@/components/Tooltip";
import { fmt } from "@/lib/format";
import type { FunnelStage } from "@/lib/data/types";

/**
 * 결제 퍼널 — 카드 폭에 따라 두 가지 형태를 쓴다.
 *
 * - "stacked" (개요 L0): 카드가 좁아 단계를 세로로 쌓는다. 가로 깔때기를
 *   좁은 폭에 욱여넣으면 단계마다 너무 얇아져 오히려 안 읽힌다(2026-09-22).
 * - "funnel" (전환 레이어): 카드가 넓어 단계 4개를 가로로 나란히 두고
 *   값 비율만큼 좁아지는 다각형을 이어 붙인다. 좁은 폭에서 쓰던 것과 달리
 *   여기서는 폭이 넓을수록 깔때기가 커 보일 뿐 빈 여백이 남지 않는다.
 *   같은 남색 계열 안에서 대비를 키우고 비중 배지를 박아 색과 숫자를
 *   바로 잇는다.
 */
const RAMP = ["#8fb7ea", "#5590d8", "#2c66ac", "#123566"];
const STEP_NAMES = ["장바구니 전환", "결제 진입", "결제 완료"];

const X0 = 46;
const X1 = 854;
const MAX_H = 140;
const TOP_MARGIN = 78;
const CY = TOP_MARGIN + MAX_H / 2;
const FOOT_Y = TOP_MARGIN + MAX_H + 30;
const VIEW_H = FOOT_Y + 30;
const PILL_W = 66;
const PILL_H = 21;
const PILL_Y = 47;

export default function FunnelCard({
  stages,
  periodLabel,
  title = "결제 퍼널",
  footnote,
  layout = "funnel",
}: {
  stages: FunnelStage[];
  periodLabel: string;
  title?: string;
  /** 표 아래 한 줄 해설. <b> 허용 */
  footnote?: string;
  /** "stacked" = 세로로 쌓는 좁은 카드용, "funnel" = 가로로 좁아지는 넓은 카드용 */
  layout?: "stacked" | "funnel";
}) {
  const top = stages[0].value;
  const steps = stages.slice(0, -1).map((s, i) => (stages[i + 1].value / s.value) * 100);
  /* 가장 많이 빠지는 구간 하나만 강조한다 — 전부 칠하면 어디를 볼지 알 수 없다 */
  const worst = steps.indexOf(Math.min(...steps));
  const endToEnd = (stages[stages.length - 1].value / top) * 100;

  if (layout === "stacked") {
    return (
      <Card title={title} note={periodLabel}>
        <div className="funnel">
          {stages.map((s, i) => (
            <div key={s.event}>
              <div className="fn-stage">
                <div className="fn-top">
                  <span className="fn-name">{s.name}</span>
                  <span className="fn-ev mono">{s.event}</span>
                  <span className="fn-val num">{fmt(s.value)}</span>
                </div>
                <div className="fn-bar">
                  <i style={{ width: `${((s.value / top) * 100).toFixed(1)}%` }} />
                </div>
              </div>
              {i < stages.length - 1 && (
                <div className={`fn-step${i === worst ? " bad" : ""}`}>
                  <span className="arrow">↳</span>
                  {STEP_NAMES[i]} <b>{steps[i].toFixed(1)}%</b>
                  {i === worst && " · 가장 큰 이탈"}
                  {stages[i + 1].avgTime && <span className="fn-time">평균 {stages[i + 1].avgTime} 소요</span>}
                </div>
              )}
            </div>
          ))}
          <div className="fn-foot">
            <span>전체 전환율</span>
            <b className="num">{endToEnd.toFixed(1)}%</b>
          </div>
          {footnote && <p className="mv-note" dangerouslySetInnerHTML={{ __html: footnote }} />}
        </div>
      </Card>
    );
  }

  return <FunnelWide stages={stages} periodLabel={periodLabel} title={title} footnote={footnote} />;
}

function FunnelWide({
  stages,
  periodLabel,
  title,
  footnote,
}: {
  stages: FunnelStage[];
  periodLabel: string;
  title: string;
  footnote?: string;
}) {
  const { show, hide } = useTooltip();
  const [hover, setHover] = useState<number | null>(null);

  const n = stages.length;
  const top = stages[0].value;
  const segW = (X1 - X0) / n;
  const h = (v: number) => (v / top) * MAX_H;
  const steps = stages.slice(0, -1).map((s, i) => (stages[i + 1].value / s.value) * 100);
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
                      <div className="tt">
                        {s.name} <span className="mono" style={{ color: "var(--faint)" }}>· {s.event}</span>
                      </div>
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
                  fontSize={19}
                  fontWeight={700}
                  fill="var(--ink)"
                  className="num"
                >
                  {fmt(s.value)}
                </text>
                {/* 비중 배지 — 아래 도형과 같은 색으로 칠해 "이 숫자가 이 덩어리" 라는 게 바로 보이게 한다 */}
                <rect
                  x={cx - PILL_W / 2}
                  y={PILL_Y}
                  width={PILL_W}
                  height={PILL_H}
                  rx={PILL_H / 2}
                  fill={RAMP[i % RAMP.length]}
                />
                <text
                  x={cx}
                  y={PILL_Y + PILL_H / 2 + 4.5}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill="#fff"
                  className="num"
                >
                  {pct.toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* 단계 사이 경계 — 이 폭이 곧 다음 단계로 넘어간 비율이다 */}
          {steps.map((pct, i) => {
            const bx = X0 + (i + 1) * segW;
            const isWorst = i === worst;
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
                {/* 가장 크게 빠지는 구간만 배지로 띄워 눈에 바로 걸리게 한다 */}
                {isWorst && (
                  <rect
                    x={bx - 86}
                    y={FOOT_Y - 17}
                    width={172}
                    height={26}
                    rx={13}
                    fill="var(--warn-soft)"
                  />
                )}
                <text
                  x={bx}
                  y={FOOT_Y}
                  textAnchor="middle"
                  fontSize={12.5}
                  fontWeight={700}
                  fill={isWorst ? "var(--warn)" : "var(--muted)"}
                >
                  ↓ {pct.toFixed(1)}%{isWorst ? " · 최대 이탈" : ""}
                </text>
                {/* avgTime 은 "도착한" 단계(stages[i+1])에 붙어 있다 — 다음 단계로 넘어가는 데 걸린 시간이라서다 */}
                {stages[i + 1].avgTime && (
                  <text x={bx} y={FOOT_Y + 17} textAnchor="middle" fontSize={11} fill="var(--faint)">
                    평균 {stages[i + 1].avgTime} 소요
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="fn2-foot">
        <span>전체 전환율</span>
        <b className="num">{endToEnd.toFixed(1)}%</b>
      </div>
      {footnote && (
        <p className="mv-note" style={{ margin: "0 18px 16px" }} dangerouslySetInnerHTML={{ __html: footnote }} />
      )}
    </Card>
  );
}
