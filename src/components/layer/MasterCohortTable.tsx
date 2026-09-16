"use client";

import { useTooltip } from "@/components/Tooltip";
import { fmt } from "@/lib/format";

const RAMP = ["var(--h1)", "var(--h2)", "var(--h3)", "var(--h4)", "var(--h5)"];

/** 순서형 램프 — 단일 색상, 밝음→어두움. 가장 어두운 단은 흰 글씨로 뒤집는다. */
function band(v: number): [string, boolean] {
  if (v >= 40) return [RAMP[4], true];
  if (v >= 30) return [RAMP[3], false];
  if (v >= 20) return [RAMP[2], false];
  if (v >= 10) return [RAMP[1], false];
  return [RAMP[0], false];
}

/**
 * 승급월 코호트 → N개월 후 활성 유지율. 가입 코호트(overview 의 CohortCard)와 같은 형식이지만
 * 열 수가 고정 5개(D1~D30)가 아니라 승급 후 경과월(최대 11개월)이라 컬럼 수를 데이터에서 뽑는다.
 */
export default function MasterCohortTable({
  rows,
}: {
  rows: { month: string; size: number; values: (number | null)[] }[];
}) {
  const { show, hide } = useTooltip();
  const cols = Math.max(...rows.map((r) => r.values.length));
  const heads = Array.from({ length: cols }, (_, i) => `${i + 1}M`);

  return (
    <div className="cohort-wrap" onMouseLeave={hide}>
      <table className="cohort">
        <thead>
          <tr>
            <th className="lead">승급월</th>
            {heads.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.month}>
              <td className="lead">
                {r.month}
                <span>{fmt(r.size)}명</span>
              </td>
              {heads.map((h, i) => {
                const v = r.values[i];
                if (v === null || v === undefined) {
                  return (
                    <td key={h}>
                      <span className="cell empty">—</span>
                    </td>
                  );
                }
                const [bg, onDark] = band(v);
                return (
                  <td key={h}>
                    <span
                      className={`cell${onDark ? " on-dark" : ""}`}
                      style={{ background: bg }}
                      onMouseMove={(ev) =>
                        show(
                          <>
                            <div className="tt">
                              {r.month} 승급 코호트 · {h}
                            </div>
                            <div className="tv">{v}%</div>
                            <div className="tt" style={{ marginTop: 3 }}>
                              {fmt(Math.round((r.size * v) / 100))} / {fmt(r.size)}명 활성 유지
                            </div>
                          </>,
                          ev,
                        )
                      }
                    >
                      {v}%
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ramp-key">
        <span className="txt">낮음</span>
        <span className="ramp">
          {RAMP.map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
        </span>
        <span className="txt">높음</span>
        <span className="txt" style={{ marginLeft: "auto" }}>
          회색 칸 = 아직 기간 미도래
        </span>
      </div>
    </div>
  );
}
