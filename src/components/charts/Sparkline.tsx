"use client";

import { useState } from "react";
import { useTooltip } from "@/components/Tooltip";
import { fmt } from "@/lib/format";

/**
 * 타일 안에 들어가는 최소 스파크라인.
 * 평소엔 값의 절대 크기가 아니라 "모양"만 전달하므로 축도 라벨도 없지만,
 * 마우스를 올리면 그 지점의 실제 값과 직전 대비 변화를 보여준다 —
 * 모양만으로는 "그래서 그 지점이 정확히 얼마였는지"를 알 수 없기 때문이다.
 */
interface Props {
  values: number[];
  /** 개선/악화에 따른 색 — 화살표 방향이 아니라 good 을 따른다 */
  color: string;
  /** 호버 시 값을 읽는 단위·자릿수 — 타일의 메인 값과 같은 규칙이어야 한다 */
  unit: string;
  decimals: number;
}

const W = 200;
const H = 44;

export default function Sparkline({ values, color, unit, decimals }: Props) {
  const { show, hide } = useTooltip();
  const [hover, setHover] = useState<number | null>(null);

  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = W / (values.length - 1);
  const txt = (v: number) => (decimals === 0 ? fmt(Math.round(v)) : v.toFixed(decimals)) + unit;

  /* 위아래 4px 씩 여백을 두어 선이 잘리지 않게 한다 */
  const pts = values.map((v, i) => {
    const x = i * step;
    const y = H - 4 - ((v - min) / span) * (H - 8);
    return { x, y };
  });
  const path = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L");

  return (
    <span
      className="spark-wrap"
      onMouseLeave={() => {
        setHover(null);
        hide();
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="최근 추이. 값은 호버로 확인하세요.">
        <path d={`M${path} L${W},${H} L0,${H} Z`} fill={color} opacity={0.08} />
        <polyline
          points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 점 하나하나가 아니라 그 사이 구간 전체를 히트 영역으로 잡는다 — 점을 정확히 노려야만
            반응하면 8개 안팎의 점으로는 쓰기 어렵다 */}
        {values.map((v, i) => {
          const bandStart = i === 0 ? 0 : (i - 0.5) * step;
          const bandEnd = i === values.length - 1 ? W : (i + 0.5) * step;
          const prev = i > 0 ? values[i - 1] : null;
          const diff = prev ? (((v - prev) / prev) * 100).toFixed(1) : null;
          return (
            <rect
              key={i}
              x={bandStart}
              y={0}
              width={bandEnd - bandStart}
              height={H}
              fill="transparent"
              onMouseMove={(ev) => {
                setHover(i);
                show(
                  <>
                    <div className="tv">{txt(v)}</div>
                    {diff !== null && (
                      <div className="tt" style={{ marginTop: 3 }}>
                        직전 대비 {Number(diff) >= 0 ? "+" : ""}
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
      {/*
        점을 SVG <circle> 로 그리면 preserveAspectRatio="none" 이 좌표계를 가로/세로
        다른 비율로 늘리기 때문에 원이 타원으로 찌그러진다 — 실제로 그랬다.
        그래서 점은 SVG 밖, 늘어나지 않는 HTML 요소로 %) 위치만 SVG 좌표에서 가져와 찍는다.
      */}
      {hover !== null && (
        <i
          className="spark-dot"
          style={{
            left: `${(pts[hover].x / W) * 100}%`,
            top: `${(pts[hover].y / H) * 100}%`,
            borderColor: color,
          }}
        />
      )}
    </span>
  );
}
