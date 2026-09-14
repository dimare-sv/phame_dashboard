"use client";

import Link from "next/link";
import Card from "@/components/Card";
import { useSettings } from "@/lib/settings-context";
import { evaluate, formatGoalValue, goalThresholdLabel, type Severity } from "@/lib/settings";
import type { WatchValue } from "@/lib/data/types";

const ORDER: Record<Severity, number> = { crit: 0, warn: 1, ok: 2 };

/**
 * "주의 필요"는 손으로 적는 목록이 아니다.
 * 감시 대상의 현재 값과 설정의 목표·임계를 맞춰 본 결과다 — 목표를 바꾸면 이 목록이 바뀐다.
 */
export default function AlertsCard({
  watch,
  highlights,
}: {
  watch: WatchValue[];
  highlights: string[];
}) {
  const { goalFor } = useSettings();

  const breaches = watch
    .map((w) => {
      const goal = goalFor(w.metricId);
      if (!goal) return null;
      const severity = evaluate(w.raw, goal);
      if (severity === "ok") return null;
      return { ...w, goal, severity };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);

  return (
    <Card
      title="주의 필요"
      note={breaches.length ? `목표·임계 이탈 ${breaches.length}건` : "이탈 없음"}
      captureName="주의필요"
    >
      <div className="alerts">
        {breaches.length === 0 && (
          <p className="state" style={{ padding: "24px 0" }}>
            설정한 목표·임계를 벗어난 지표가 없습니다.
          </p>
        )}

        {breaches.map((b) => (
          <div className="al-row" key={b.metricId}>
            {/* 상태색은 반드시 텍스트 라벨과 함께 — 색만으로 심각도를 알리지 않는다 */}
            <span className={`pill p-${b.severity}`}>
              {b.severity === "crit" ? "위험" : "경고"}
            </span>
            <span className="al-name">
              {b.goal.layerSlug ? (
                <Link href={`/layer/${b.goal.layerSlug}`}>{b.name}</Link>
              ) : (
                b.name
              )}
            </span>
            <span
              className="al-val num"
              style={{ color: b.severity === "crit" ? "var(--crit)" : "var(--warn)" }}
            >
              {formatGoalValue(b.raw, b)}
            </span>
            <span className="al-th">{goalThresholdLabel(b.goal)}</span>
          </div>
        ))}

        <div className="hl-head">이번 주 하이라이트</div>
        {highlights.map((h) => (
          <div className="hl-row" key={h}>
            <span className="bullet">▸</span>
            <span dangerouslySetInnerHTML={{ __html: h }} />
          </div>
        ))}
      </div>
    </Card>
  );
}
