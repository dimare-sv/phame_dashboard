"use client";

import Card from "@/components/Card";
import { useTooltip } from "@/components/Tooltip";
import { fmt } from "@/lib/format";
import type { CohortRow } from "@/lib/data/types";

const COLS = ["D1", "D3", "D7", "D14", "D30"];
const RAMP = ["var(--h1)", "var(--h2)", "var(--h3)", "var(--h4)", "var(--h5)"];

/** 순서형 램프 — 단일 색상, 밝음→어두움. 가장 어두운 단은 흰 글씨로 뒤집는다. */
function band(v: number): [string, boolean] {
  if (v >= 40) return [RAMP[4], true];
  if (v >= 32) return [RAMP[3], false];
  if (v >= 26) return [RAMP[2], false];
  if (v >= 20) return [RAMP[1], false];
  return [RAMP[0], false];
}

export default function CohortCard({ rows }: { rows: CohortRow[] }) {
  const { show, hide } = useTooltip();

  return (
    <Card
      title="가입 코호트 리텐션"
      note="가입 주차별 재방문율"
      fixedChip="기간 필터 비적용"
    >
      <div className="cohort-wrap" onMouseLeave={hide}>
        <table className="cohort">
          <thead>
            <tr>
              <th className="lead">가입 주차</th>
              {COLS.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.week}>
                <td className="lead">
                  {r.week}
                  <span>{fmt(r.size)}명</span>
                </td>
                {r.values.map((v, i) => {
                  if (v === null) {
                    return (
                      <td key={i}>
                        <span className="cell empty">—</span>
                      </td>
                    );
                  }
                  const [bg, onDark] = band(v);
                  return (
                    <td key={i}>
                      <span
                        className={`cell${onDark ? " on-dark" : ""}`}
                        style={{ background: bg }}
                        onMouseMove={(ev) =>
                          show(
                            <>
                              <div className="tt">
                                {r.week} 가입 코호트 · {COLS[i]}
                              </div>
                              <div className="tv">{v}%</div>
                              <div className="tt" style={{ marginTop: 3 }}>
                                {fmt(Math.round((r.size * v) / 100))} / {fmt(r.size)}명 재방문
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
    </Card>
  );
}
