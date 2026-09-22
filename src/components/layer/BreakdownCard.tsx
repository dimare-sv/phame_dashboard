"use client";

import { useState } from "react";
import Card from "@/components/Card";
import Flag from "@/components/Flag";
import Donut from "@/components/charts/Donut";
import { useTooltip } from "@/components/Tooltip";
import { fmtWon, pct, splitExact } from "@/lib/format";
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
 * 검증기로 고른 ColorBrewer OrRd 계열이다. 인접 ΔE 는 deutan 13.7 / 정상 시각 16.4 —
 * 이전 값(#EDB47C 계열, 인접 ΔE 11.4)보다 확실히 벌어졌다. 명도만 낮추는 대신
 * 색상 자체를 주황→빨강으로 옮겨서("색이 진해진다" 가 아니라 "색이 달라진다") 단을
 * 더 멀리 떨어뜨렸다 — 등급이 더 잘 구분되길 원한다는 요청에 맞춘 값.
 */
const SELLER_RAMP = ["#FDD49E", "#FC8D59", "#D7301F", "#7F0000"];

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
  const { show, hide } = useTooltip();
  const [targetId, setTargetId] = useState(breakdown.targets[0].id);
  const [axisId, setAxisId] = useState(breakdown.axes[0].id);

  const target = breakdown.targets.find((t) => t.id === targetId) ?? breakdown.targets[0];
  const axis = breakdown.axes.find((a) => a.id === axisId) ?? breakdown.axes[0];

  const ratios = axis.ratios[target.id] ?? [];
  const counts = splitExact(target.total, ratios);
  /* 램프는 5단이므로, 항목이 더 적으면 어두운 쪽부터 쓰지 않고 균등하게 고른다 */
  const palette = axis.colors
    ? axis.items.map((label) => axis.colors![label] ?? "#7A8699")
    : axis.roleSplit
    ? roleSplitPalette(axis.items)
    : axis.ordinal
    ? axis.items.map(
        (_, i) => ORDINAL[Math.round((i / Math.max(1, axis.items.length - 1)) * (ORDINAL.length - 1))],
      )
    : CATEGORICAL;
  const caveat = axis.caveats?.[target.id];

  /* 국가처럼 아이콘(국기)이 색보다 더 잘 구분되는 축은 색 점 대신 아이콘을 쓴다 */
  const swatch = (label: string, i: number) =>
    axis.icons?.[label] ? (
      <Flag code={axis.icons[label]} />
    ) : (
      <i className="sw" style={{ background: palette[i] }} />
    );

  /* 항목별 참고 텍스트(결제수단 → PG 수수료 등) — 있을 때만 (i) 를 붙인다.
     줄마다 \n 으로 나눠 저장해 두고 여기서 줄바꿈해서 보여준다 */
  const noteTip = (label: string) => {
    const note = axis.itemNotes?.[label];
    if (!note) return null;
    const lines = note.split("\n");
    const content = (
      <>
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </>
    );
    return (
      <i
        className="info-tip"
        role="img"
        aria-label={`${label} 참고: ${lines.join(", ")}`}
        tabIndex={0}
        onClick={(ev) => {
          ev.preventDefault();
          ev.stopPropagation();
        }}
        onMouseEnter={(ev) => show(content, ev, { wide: true })}
        onMouseMove={(ev) => show(content, ev, { wide: true })}
        onMouseLeave={hide}
        onFocus={(ev) =>
          show(
            content,
            {
              clientX: ev.currentTarget.getBoundingClientRect().right,
              clientY: ev.currentTarget.getBoundingClientRect().top,
            },
            { wide: true },
          )
        }
        onBlur={hide}
      >
        i
      </i>
    );
  };

  function pickAxis(id: string) {
    setAxisId(id);
    onAxisChange?.(id);
  }

  return (
    <Card title="" bare>
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
            <b className="num">{fmtWon(target.total, target.unit)}</b>
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
                  {swatch(n, i)}
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
                        {swatch(n, i)}
                        {n}
                        {noteTip(n)}
                      </span>
                    </td>
                    <td className="num">{c ? fmtWon(c, target.unit) : "—"}</td>
                    <td className="num pc">
                      {c ? (
                        <span className="pc-cell">
                          <i className="pc-track">
                            <i
                              className="pc-fill"
                              style={{
                                width: `${Math.min(100, (c / target.total) * 100).toFixed(1)}%`,
                                background: palette[i],
                              }}
                            />
                          </i>
                          {pct(c, target.total)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
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
