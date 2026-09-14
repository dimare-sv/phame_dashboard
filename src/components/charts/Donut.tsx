"use client";

import { useTooltip } from "@/components/Tooltip";
import { fmt, pct } from "@/lib/format";

interface Props {
  counts: number[];
  names: string[];
  colors: string[];
  /** 가운데 큰 숫자 아래 붙는 설명 */
  centerSub: string;
  /** 툴팁 머리말 — "유입채널", "플랫폼" */
  tipTitle: string;
  unit?: string;
}

/**
 * 도넛은 stroke-dasharray 로 그린다.
 * 각 조각은 하나의 <circle> 이고, dashoffset 으로 시작점을 민다.
 * -90° 회전은 12시 방향에서 시작시키기 위한 것.
 */
export default function Donut({ counts, names, colors, centerSub, tipTitle, unit = "명" }: Props) {
  const { show, hide } = useTooltip();
  const total = counts.reduce((a, b) => a + b, 0);
  const R = 82;
  const CIRC = 2 * Math.PI * R;

  let acc = 0;
  const segs = counts.map((c, i) => {
    if (!c || total === 0) return null;
    const len = (c / total) * CIRC;
    /* 조각 사이를 배경색으로 2.5 벌린다. 너무 얇은 조각은 아예 안 보이므로 건너뛴다 */
    const gap = len > 8 ? 2.5 : 0;
    const seg = (
      <circle
        key={i}
        cx={120}
        cy={120}
        r={R}
        fill="none"
        stroke={colors[i % colors.length]}
        strokeWidth={36}
        strokeDasharray={`${(len - gap).toFixed(2)} ${(CIRC - len + gap).toFixed(2)}`}
        strokeDashoffset={(-acc).toFixed(2)}
        data-i={i}
      />
    );
    acc += len;
    return seg;
  });

  return (
    <div
      className="donut"
      onMouseMove={(ev) => {
        const el = (ev.target as Element).closest("circle[data-i]");
        if (!el) {
          hide();
          return;
        }
        const i = Number(el.getAttribute("data-i"));
        show(
          <>
            <div className="tt">{tipTitle}</div>
            <div className="tr">
              <i className="sw" style={{ background: colors[i % colors.length] }} />
              {names[i]}
              <b>
                {fmt(counts[i])}
                {unit}
              </b>
            </div>
            <div className="tt" style={{ marginTop: 2 }}>
              비중 {pct(counts[i], total)}
            </div>
          </>,
          ev,
        );
      }}
      onMouseLeave={hide}
    >
      <svg viewBox="0 0 240 240" role="img" aria-label={`${tipTitle} 구성 도넛 차트`}>
        <g transform="rotate(-90 120 120)">{segs}</g>
        <text
          x={120}
          y={114}
          textAnchor="middle"
          fontSize={27}
          fontWeight={700}
          fill="var(--ink)"
          letterSpacing={-1}
        >
          {fmt(total)}
        </text>
        <text x={120} y={136} textAnchor="middle" fontSize={13} fill="var(--muted)">
          {centerSub}
        </text>
      </svg>
    </div>
  );
}
