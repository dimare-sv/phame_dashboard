"use client";

import Link from "next/link";
import Sparkline from "@/components/charts/Sparkline";
import { useSettings } from "@/lib/settings-context";
import { evaluate, goalFootValue, missesTarget } from "@/lib/settings";
import type { Tile } from "@/lib/data/types";

/**
 * 개요 타일 8개 = 레이어 8개의 메인 지표.
 *
 * 하단의 목표·임계와 경고 점은 설정에서 계산한다 — 여기에 숫자를 적어두지 않는다.
 * 설정에서 목표를 바꾸면 이 화면이 바로 따라간다.
 */
export default function Tiles({ tiles }: { tiles: Tile[] }) {
  const { goalFor } = useSettings();

  return (
    <div className="tiles">
      {tiles.map((t) => {
        /* 색은 ▲▼가 아니라 good(좋아졌나)을 따른다 */
        const color = t.delta.good ? "var(--good)" : "var(--crit)";
        const goal = goalFor(t.metricId);
        const sev = goal ? evaluate(t.raw, goal) : "ok";
        return (
          <Link className="tile" key={t.idx} href={t.href}>
            <span className="t-title">
              <i>{t.idx}</i>
              {t.name}
              {sev !== "ok" && (
                <i
                  className={`flag f-${sev}`}
                  title={sev === "crit" ? "위험 수준" : "목표·임계 이탈"}
                />
              )}
            </span>
            <span className="t-row">
              <span className="t-val num">{t.value}</span>
              <span className={`delta ${t.delta.good ? "d-good" : "d-bad"}`}>{t.delta.text}</span>
            </span>
            <span className="t-spark">
              <Sparkline values={t.spark} color={color} />
            </span>
            {goal && (
              <span className="t-foot">
                <span className="k">{goal.footLabel}</span>
                {/* 목표 미달은 경고가 아니지만, 아무 표시도 없으면 그냥 안 보인다 */}
                {missesTarget(t.raw, goal) && <span className="miss">미달</span>}
                <span className="v num">{goalFootValue(goal)}</span>
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
