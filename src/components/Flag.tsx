import type { ReactElement } from "react";

/**
 * 국기 이모지(🇰🇷 등)는 윈도우에서 그림이 아니라 "KR" 같은 두 글자 코드로만 보인다
 * (윈도우 정책상 플래그 이모지 글리프를 제공하지 않는다). OS 에 상관없이 항상 그림으로
 * 보이도록 작은 인라인 SVG 로 직접 그린다.
 */
const FLAGS: Record<string, ReactElement> = {
  KR: (
    <svg viewBox="0 0 30 20" width="16" height="11">
      <rect width="30" height="20" fill="#fff" />
      <g transform="translate(15,10)">
        <path d="M0,-6 A6,6 0 0,1 0,6 A3,3 0 0,1 0,0 A3,3 0 0,0 0,-6 Z" fill="#C60C30" />
        <path d="M0,6 A6,6 0 0,1 0,-6 A3,3 0 0,1 0,0 A3,3 0 0,0 0,6 Z" fill="#003478" />
      </g>
    </svg>
  ),
  US: (
    <svg viewBox="0 0 30 20" width="16" height="11">
      <rect width="30" height="20" fill="#fff" />
      {[0, 2, 4, 6].map((i) => (
        <rect key={i} y={(i * 20) / 7} width="30" height={20 / 7} fill="#B22234" />
      ))}
      <rect x="0" y="0" width="13" height={(20 * 4) / 7} fill="#3C3B6E" />
    </svg>
  ),
  JP: (
    <svg viewBox="0 0 30 20" width="16" height="11">
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="5.4" fill="#BC002D" />
    </svg>
  ),
  CN: (
    <svg viewBox="0 0 30 20" width="16" height="11">
      <rect width="30" height="20" fill="#DE2910" />
      <polygon
        points="6,3 7.2,6.4 10.8,6.4 7.9,8.5 9,11.9 6,9.8 3,11.9 4.1,8.5 1.2,6.4 4.8,6.4"
        fill="#FFDE00"
      />
    </svg>
  ),
  /* 나머지 — 특정 국기가 아니라 그 밖 전체를 뜻하므로 지구본으로 */
  ETC: (
    <svg viewBox="0 0 20 20" width="14" height="14">
      <circle cx="10" cy="10" r="8" fill="none" stroke="#7A8699" strokeWidth="1.4" />
      <ellipse cx="10" cy="10" rx="3.6" ry="8" fill="none" stroke="#7A8699" strokeWidth="1.2" />
      <line x1="2" y1="10" x2="18" y2="10" stroke="#7A8699" strokeWidth="1.2" />
    </svg>
  ),
};

export default function Flag({ code }: { code: string }) {
  const svg = FLAGS[code];
  if (!svg) return null;
  return (
    <span className="flag-icon" role="img" aria-label={code}>
      {svg}
    </span>
  );
}
