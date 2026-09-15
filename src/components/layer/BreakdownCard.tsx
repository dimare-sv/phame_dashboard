"use client";

import { useState } from "react";
import Card from "@/components/Card";
import Donut from "@/components/charts/Donut";
import { fmt, pct, splitExact } from "@/lib/format";
import type { Breakdown } from "@/lib/data/types";
import { SELLER_GRADE_LABELS, sideOf } from "@/lib/segments";

/* 명목형 5색 — CVD 전체 쌍 검증 통과 */
const CATEGORICAL = ["#2E6FB7", "#C0660A", "#A03A8F", "#0F8E63", "#7A8699"];
/* 순서가 있는 축(가격대·버전)은 단일 색상 램프로 — 순서를 색이 말해준다 */
const ORDINAL = ["#8FB6DA", "#649BCB", "#3E79B6", "#1E5A97", "#0C3559"];
/**
 * 등급 축은 중간에 **역할이 바뀐다** (파머 → 파머셀러).
 * 하나의 램프로 칠하면 그 경계가 지워지고 "한 칸씩 오르는 등급" 으로 읽히므로,
 * 구매자 쪽은 파랑 계열, 판매자 쪽은 주황 계열로 나눠 칠한다.
 */
const BUYER_RAMP = ["#8FB6DA", "#2E6FB7"];
/**
 * 판매자 4단계는 **순서형**이라 단일 색상 램프가 맞다(명목형 램프가 아니다).
 * 그래서 인접 ΔE 15 라는 명목형 기준은 적용되지 않는다 — 단일 색상 4단으로는
 * 물리적으로 만족할 수 없고, 순서형에 요구되는 것은 **명도 단조성 + 보조 표기**다.
 * 범례와 우측 표가 항목명·값·비중을 전부 글자로 적어 주므로 색 단독으로 읽히지 않는다.
 *
 * 값은 dataviz 검증기로 고른 것이다(CVD 인접 분리 ΔE 11.4, 목표 8 이상 통과).
 * 처음 쓴 #5A2D04 는 너무 어둡고 채도가 낮아 바로 윗 단계와 구분되지 않아 교체했다.
 */
const SELLER_RAMP = ["#EDB47C", "#D98A2C", "#B0600C", "#7A4206"];

function roleSplitPalette(items: string[]): string[] {
  return items.map((label) => {
    const side = sideOf(label);
    if (side === "seller") {
      const idx = SELLER_GRADE_LABELS.indexOf(label);
      return SELLER_RAMP[Math.min(Math.max(idx, 0), SELLER_RAMP.length - 1)];
    }
    /* 비회원·파머 — 구매자 쪽 */
    return label === "비회원" ? BUYER_RAMP[0] : BUYER_RAMP[1];
  });
}

/**
 * 분해는 "대상(무엇을) × 축(어떻게)" 2축이다.
 * 8개 레이어가 전부 이 카드를 쓴다 — 레이어마다 바뀌는 건 대상과 축 목록뿐이다.
 */
export default function BreakdownCard({
  breakdown,
  periodLabel,
  onAxisChange,
}: {
  breakdown: Breakdown;
  periodLabel: string;
  onAxisChange?: (axisId: string) => void;
}) {
  const [targetId, setTargetId] = useState(breakdown.targets[0].id);
  const [axisId, setAxisId] = useState(breakdown.axes[0].id);

  const target = breakdown.targets.find((t) => t.id === targetId) ?? breakdown.targets[0];
  const axis = breakdown.axes.find((a) => a.id === axisId) ?? breakdown.axes[0];

  const ratios = axis.ratios[target.id] ?? [];
  const counts = splitExact(target.total, ratios);
  /* 램프는 5단이므로, 항목이 더 적으면 어두운 쪽부터 쓰지 않고 균등하게 고른다 */
  const palette = axis.roleSplit
    ? roleSplitPalette(axis.items)
    : axis.ordinal
    ? axis.items.map(
        (_, i) => ORDINAL[Math.round((i / Math.max(1, axis.items.length - 1)) * (ORDINAL.length - 1))],
      )
    : CATEGORICAL;
  const caveat = axis.caveats?.[target.id];

  function pickAxis(id: string) {
    setAxisId(id);
    onAxisChange?.(id);
  }

  return (
    <Card title="" bare captureName={`분해_${target.label}_${axis.label}`}>
      <div className="bd-ctrl">
        <span className="bd-key">대상</span>
        {breakdown.targets.map((t) => (
          <button
            key={t.id}
            className="bd-chip"
            type="button"
            aria-pressed={t.id === target.id}
            onClick={() => setTargetId(t.id)}
          >
            {t.label}
          </button>
        ))}
        {target.fixedPeriod && (
          <span className="stock-note">기간 필터 비적용 · 기준일 시점 잔액</span>
        )}
      </div>

      <div className="bd-ctrl second">
        <span className="bd-key">축</span>
        {breakdown.axes.map((a) => (
          <button
            key={a.id}
            className="bd-chip"
            type="button"
            aria-pressed={a.id === axis.id}
            onClick={() => pickAxis(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>

      {caveat && <div className="bd-caveat" dangerouslySetInnerHTML={{ __html: caveat }} />}

      <div className="bd-body">
        <div>
          <div className="bd-total">
            <b className="num">
              {fmt(target.total)}
              {target.unit}
            </b>
            <span>
              {target.fixedPeriod ? target.label : `${target.label} · ${periodLabel}`} · {axis.label}{" "}
              분해
            </span>
          </div>
          <Donut
            counts={counts}
            names={axis.items}
            colors={palette}
            centerSub={target.label}
            tipTitle={axis.label}
            unit={target.unit}
          />
          <div className="bd-legend">
            {axis.items.map((n, i) =>
              counts[i] ? (
                <span key={n}>
                  <i className="sw" style={{ background: palette[i] }} />
                  {n} <b>{pct(counts[i], target.total)}</b>
                </span>
              ) : null,
            )}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="bd">
            <thead>
              <tr>
                <th>항목</th>
                <th>값</th>
                <th>비중</th>
                <th>전기 대비</th>
              </tr>
            </thead>
            <tbody>
              {axis.items.map((n, i) => {
                const c = counts[i];
                return (
                  <tr key={n}>
                    <td>
                      <span className="nm">
                        <i className="sw" style={{ background: palette[i] }} />
                        {n}
                      </span>
                    </td>
                    <td className="num">{c ? fmt(c) + target.unit : "—"}</td>
                    <td className="num pc">{c ? pct(c, target.total) : "—"}</td>
                    <td
                      className="num"
                      style={{ color: axis.deltas[i]?.good ? "var(--good)" : "var(--crit)" }}
                    >
                      {c ? axis.deltas[i]?.text : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
