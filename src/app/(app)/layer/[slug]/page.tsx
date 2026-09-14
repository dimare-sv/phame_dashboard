"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Band from "@/components/Band";
import Card from "@/components/Card";
import Stub from "@/components/Stub";
import TrendChart from "@/components/charts/TrendChart";
import BreakdownCard from "@/components/layer/BreakdownCard";
import ExtraTableCard from "@/components/layer/ExtraTableCard";
import { useDashboard } from "@/lib/dashboard-context";
import { useDashboardData } from "@/lib/use-dashboard-data";
import type { LayerData } from "@/lib/data/types";

/**
 * 8개 레이어가 공유하는 단 하나의 화면.
 *
 * 메인 지표 → 서브 지표 → 분해(대상 × 축) → 레이어 고유 표.
 * 레이어마다 달라지는 것은 전부 데이터 쪽에 있다 — 여기에 레이어 이름을 쓰지 말 것.
 */
export default function LayerPage() {
  const { slug } = useParams<{ slug: string }>();
  const { period, cmpLabel } = useDashboard();
  const { data, error, loading } = useDashboardData<LayerData>(`layer/${slug}`, period);
  const [axisId, setAxisId] = useState<string | null>(null);

  /* 아직 정의하지 않은 레이어(지표 사전·설정 등)는 준비 중 화면으로 */
  if (error) return <Stub />;
  if (loading || !data) {
    return (
      <div className="canvas">
        <p className="state">불러오는 중…</p>
      </div>
    );
  }

  const m = data.main;
  const cmpText = `${data.period.range} · ${cmpLabel(data.period)} 대비`;
  const currentAxis = axisId ?? data.breakdown.axes[0].id;
  const showExtra = data.extra && (!data.extra.showOnAxis || data.extra.showOnAxis === currentAxis);

  return (
    <div className="canvas">
      <Band label="메인 지표" hint={cmpText} />
      <div className="r-hero">
        <Card title="" bare className="hero-card" captureName={m.eyebrow}>
          <span className="hero-eyebrow">{m.eyebrow}</span>
          <span className="hero-name">{m.name}</span>
          <span className="hero-val num">{m.value}</span>
          <span style={{ marginTop: 9 }}>
            <span className={`delta ${m.delta.good ? "d-good" : "d-bad"}`}>{m.delta.text}</span>
          </span>
          <span className="hero-cmp">{cmpText}</span>
          <div className="hero-sub">
            {m.footer.map((f) => (
              <div key={f.k}>
                <span className="k">{f.k}</span>
                <span className={`v num${f.pending ? " na" : ""}`}>{f.v}</span>
                {f.pending && <span className="pending">{f.pending}</span>}
              </div>
            ))}
          </div>
        </Card>

        <Card
          title={`${m.eyebrow} 추이`}
          note={data.trend.granularity}
          className="chart-card"
          captureName={`${m.eyebrow}_추이`}
        >
          <div className="chart-wrap">
            <TrendChart
              series={data.trend.series}
              labels={data.trend.labels}
              unit={data.trend.unit}
              decimals={data.trend.decimals}
              kind={data.trend.kind}
              ariaLabel={`${m.eyebrow} 추이 · ${data.trend.granularity}`}
            />
          </div>
        </Card>
      </div>

      <Band label="서브 지표" />
      <div className="subtiles">
        {data.subs.map((s) => (
          <div className="subtile" key={s.name}>
            <span className="sn">{s.name}</span>
            <span className="srow">
              <span className="sv num">{s.value}</span>
              <span className={`delta ${s.delta.good ? "d-good" : "d-bad"}`}>{s.delta.text}</span>
            </span>
          </div>
        ))}
      </div>

      <Band label="분해" hint="대상을 고르고, 어떤 축으로 쪼갤지 고릅니다" />
      <BreakdownCard
        /* 레이어가 바뀌면 대상·축 선택을 초기화한다 */
        key={slug}
        breakdown={data.breakdown}
        periodLabel={data.period.label}
        onAxisChange={setAxisId}
      />

      {showExtra && data.extra && <ExtraTableCard table={data.extra} />}
    </div>
  );
}
