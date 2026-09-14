/**
 * 타일 안에 들어가는 최소 스파크라인.
 * 값의 절대 크기가 아니라 "모양"만 전달하므로 축도 라벨도 없다.
 */
interface Props {
  values: number[];
  /** 개선/악화에 따른 색 — 화살표 방향이 아니라 good 을 따른다 */
  color: string;
}

const W = 200;
const H = 44;

export default function Sparkline({ values, color }: Props) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = W / (values.length - 1);

  /* 위아래 4px 씩 여백을 두어 선이 잘리지 않게 한다 */
  const pts = values.map((v, i) => {
    const x = i * step;
    const y = H - 4 - ((v - min) / span) * (H - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={`M${pts.join(" L")} L${W},${H} L0,${H} Z`} fill={color} opacity={0.08} />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
