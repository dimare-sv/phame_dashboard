export const fmt = (n: number) => n.toLocaleString("en-US");

export const pct = (part: number, total: number, dec = 1) =>
  total === 0 ? "0.0%" : `${((part / total) * 100).toFixed(dec)}%`;

/** 초를 m:ss 로 — 평균 세션처럼 초 단위 지표에 쓴다 */
export const mmss = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;

/**
 * 비율 × 합계를 정수로 쪼개되 합이 정확히 맞게 (최대잔여법).
 * 그냥 반올림하면 조각 합이 총계와 1~2 어긋나서, 표와 도넛의 숫자가 안 맞는다.
 */
export function splitExact(total: number, ratios: number[]): number[] {
  const raw = ratios.map((r) => total * r);
  const out = raw.map(Math.floor);
  const rest = total - out.reduce((a, b) => a + b, 0);
  raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
    .slice(0, rest)
    .forEach((x) => {
      out[x.i] += 1;
    });
  return out;
}

/** "1,204" → 1204 — 표기용 문자열에서 총계를 되찾을 때 */
export const parseNum = (s: string) => parseInt(s.replace(/[^0-9-]/g, ""), 10);
