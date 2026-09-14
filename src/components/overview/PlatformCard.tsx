"use client";

import Card from "@/components/Card";
import Donut from "@/components/charts/Donut";
import { fmt, mmss, pct } from "@/lib/format";
import type { PlatformData, PlatformRow } from "@/lib/data/types";

function cell(v: number | null, row: PlatformRow) {
  if (v === null) return "—";
  return row.unit === "s" ? mmss(v) : `${v.toFixed(row.decimals)}${row.unit}`;
}

/**
 * 플랫폼은 "비중"보다 "격차"를 보는 축이다.
 * 전환율·결제실패율이 플랫폼마다 다르면 그건 UX/결제 플로우 문제 신호다.
 */
export default function PlatformCard({
  platform,
  periodLabel,
}: {
  platform: PlatformData;
  periodLabel: string;
}) {
  const total = platform.users.reduce((a, b) => a + b, 0);

  return (
    <Card title="iOS · Android · Web" note={`${periodLabel} · ${platform.base}`} captureName="플랫폼별현황">
      <div className="pf-body">
        <Donut
          counts={platform.users}
          names={platform.columns}
          colors={platform.colors}
          centerSub="활성 유저"
          tipTitle="플랫폼"
        />
        <div className="pf-scroll">
          <table className="pf">
            <thead>
              <tr>
                <th>지표</th>
                {platform.columns.map((c, i) => (
                  <th key={c}>
                    <i className="sw" style={{ background: platform.colors[i] }} />
                    {c}
                  </th>
                ))}
                <th>격차</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>활성 유저</td>
                {platform.users.map((u, i) => (
                  <td className="num" key={i}>
                    {fmt(u)}
                    <span className="share"> · {pct(u, total)}</span>
                  </td>
                ))}
                <td className="gap">—</td>
              </tr>

              {platform.rows.map((r) => {
                const nums = r.values.filter((x): x is number => x !== null);
                const mx = Math.max(...nums);
                const mn = Math.min(...nums);
                const gap = mx - mn;
                const best = r.higherIsBetter ? mx : mn;
                const worst = r.higherIsBetter ? mn : mx;
                const hot = gap >= r.gapWarn;
                return (
                  <tr key={r.name}>
                    <td>{r.name}</td>
                    {r.values.map((x, i) => (
                      <td
                        key={i}
                        className={`num${x === null ? "" : x === best ? " best" : x === worst ? " worst" : ""}`}
                      >
                        {cell(x, r)}
                      </td>
                    ))}
                    <td className={`gap num${hot ? " hot" : ""}`}>
                      {r.unit === "s" ? mmss(gap) : `${gap.toFixed(r.decimals)}%p`}
                      {hot && " ⚠"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="pf-note">
        <b>주의</b> — 현재 플랫폼 비중은 <b>기기 기준</b>입니다. 앱과 웹을 함께 쓰는 유저가
        양쪽에서 중복 계산되어 합계가 실제 유저 수보다 큽니다. <b>GA4 <code>user_id</code></b>가
        붙어야 사람 기준으로 정확해집니다 (오픈 전 조치 ①과 동일 선행 조건).
      </p>
    </Card>
  );
}
