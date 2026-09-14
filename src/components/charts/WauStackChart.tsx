"use client";

import { useTooltip } from "@/components/Tooltip";
import { fmt } from "@/lib/format";
import type { WauCompositionPoint } from "@/lib/data/types";

const BASE = 264;
/** 0 눈금(BASE)에서 최댓값 눈금까지의 픽셀 높이 */
const PLOT = 180;
const X0 = 50;
const BAR = 40;
const GAP = 13;

export default function WauStackChart({ points }: { points: WauCompositionPoint[] }) {
  const { show, hide } = useTooltip();

  const totals = points.map((p) => p.keep + p.back + p.fresh);
  /* 눈금이 0 / 6K / 12K 로 떨어지도록 위쪽을 2,000 단위로 올림 */
  const max = Math.ceil(Math.max(...totals) / 2000) * 2000;
  const h = (v: number) => (v / max) * PLOT;

  const last = points.length - 1;

  return (
    <svg
      viewBox="0 0 700 306"
      role="img"
      aria-label="WAU 구성 12주 누적 막대 — 유지층이 꾸준히 두꺼워지는 추세"
      onMouseLeave={hide}
    >
      {[0, max / 2, max].map((t) => (
        <g key={t}>
          <line
            x1={42}
            y1={BASE - h(t)}
            x2={694}
            y2={BASE - h(t)}
            stroke="var(--grid)"
            strokeWidth={1}
          />
          <text
            x={34}
            y={BASE - h(t) + 4}
            fontSize={12}
            fill="var(--muted)"
            textAnchor="end"
            className="mono"
          >
            {t === 0 ? "0" : `${t / 1000}K`}
          </text>
        </g>
      ))}

      {points.map((s, i) => {
        const x = X0 + i * (BAR + GAP);
        const hk = h(s.keep);
        const hb = h(s.back);
        const hn = h(s.fresh);
        const yk = BASE - hk;
        /* 세그먼트 사이 2px 는 배경색이 보이는 간격 — 경계가 색만으로 구분되지 않게 */
        const yb = yk - 2 - hb;
        const yn = yb - 2 - hn;
        return (
          <g
            key={s.week}
            onMouseMove={(ev) =>
              show(
                <>
                  <div className="tt">
                    {s.week} 주 · 합계 {fmt(totals[i])}
                  </div>
                  <div className="tr">
                    <i className="sw" style={{ background: "var(--s-keep)" }} />
                    유지<b>{fmt(s.keep)}</b>
                  </div>
                  <div className="tr">
                    <i className="sw" style={{ background: "var(--s-back)" }} />
                    복귀<b>{fmt(s.back)}</b>
                  </div>
                  <div className="tr">
                    <i className="sw" style={{ background: "var(--s-new)" }} />
                    신규<b>{fmt(s.fresh)}</b>
                  </div>
                </>,
                ev,
              )
            }
          >
            <rect x={x} y={20} width={BAR} height={BASE - 20} fill="transparent" />
            <rect x={x} y={yk} width={BAR} height={hk} fill="var(--s-keep)" />
            <rect x={x} y={yb} width={BAR} height={hb} fill="var(--s-back)" />
            <rect x={x} y={yn} width={BAR} height={hn} rx={2} fill="var(--s-new)" />
            {(i % 3 === 0 || i === last) && (
              <text
                x={x + BAR / 2}
                y={290}
                fontSize={12}
                fill="var(--muted)"
                textAnchor="middle"
                className="mono"
              >
                {s.week}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
