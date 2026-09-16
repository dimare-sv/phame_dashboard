"use client";

import { useTooltip } from "@/components/Tooltip";

interface Props {
  months: string[];
  /** 상위 20% 가 차지하는 GMV 비중(%) — 나머지는 100 - share 로 채운다 */
  share: number[];
}

/* 다른 레이어의 TrendChart 와 같은 캔버스 좌표계 — 차트마다 크기가 따로 노는 걸 막는다 */
const X0 = 62;
const X1 = 884;
const BASE = 156;
const TOP = 16;

/** 상위 20% 집중도 — 100% 기준 2단 누적 막대. 위가 상위 20%, 아래가 나머지 80% */
export default function Top20ShareChart({ months, share }: Props) {
  const { show, hide } = useTooltip();
  const h = (pct: number) => (pct / 100) * (BASE - TOP);

  const slot = (X1 - X0) / months.length;
  const bw = Math.min(slot - 10, 46);
  const cx = (i: number) => X0 + i * slot + slot / 2;

  return (
    <svg viewBox="0 0 900 196" role="img" aria-label="상위 20% 마스터 GMV 비중 · 월별 추이" onMouseLeave={hide}>
      {[0, 50, 100].map((t) => (
        <g key={t}>
          <line x1={X0} y1={BASE - h(t)} x2={X1} y2={BASE - h(t)} stroke="var(--grid)" strokeWidth={1} />
          <text x={X0 - 8} y={BASE - h(t) + 4} fontSize={12} fill="var(--muted)" textAnchor="end" className="mono">
            {t}%
          </text>
        </g>
      ))}

      {months.map((mo, i) => {
        const top = Math.min(100, Math.max(0, share[i]));
        const rest = 100 - top;
        const hTop = h(top);
        const hRest = h(rest);
        const yTop = BASE - hTop;
        const yRest = yTop - 2 - hRest;
        const x = cx(i) - bw / 2;
        return (
          <g
            key={mo}
            onMouseMove={(ev) =>
              show(
                <>
                  <div className="tt">{mo}</div>
                  <div className="tr">
                    <i className="sw" style={{ background: "var(--navy)" }} />
                    상위 20% <b>{top.toFixed(1)}%</b>
                  </div>
                  <div className="tr">
                    <i className="sw" style={{ background: "var(--line)" }} />
                    나머지 80% <b>{rest.toFixed(1)}%</b>
                  </div>
                </>,
                ev,
              )
            }
          >
            <rect x={x} y={TOP} width={bw} height={BASE - TOP} fill="transparent" />
            <rect x={x} y={yTop} width={bw} height={hTop} rx={2} fill="var(--navy)" />
            <rect x={x} y={yRest} width={bw} height={hRest} rx={2} fill="var(--line)" />
          </g>
        );
      })}

      <line x1={X0} y1={BASE} x2={X1} y2={BASE} stroke="var(--line)" strokeWidth={1} />

      {[0, Math.floor((months.length - 1) / 2), months.length - 1].map((i, k) => (
        <text
          key={i}
          x={cx(i)}
          y={BASE + 26}
          fontSize={12}
          fill="var(--muted)"
          textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}
          className="mono"
        >
          {months[i]}
        </text>
      ))}
    </svg>
  );
}
