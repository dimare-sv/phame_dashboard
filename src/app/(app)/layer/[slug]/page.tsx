"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import Band from "@/components/Band";
import Card from "@/components/Card";
import Stub from "@/components/Stub";
import Sparkline from "@/components/charts/Sparkline";
import TrendChart from "@/components/charts/TrendChart";
import BreakdownCard from "@/components/layer/BreakdownCard";
import ExtraTableCard from "@/components/layer/ExtraTableCard";
import LeaderboardCard from "@/components/layer/LeaderboardCard";
import FunnelCard from "@/components/overview/FunnelCard";
import InfoTip from "@/components/InfoTip";
import { useDashboard } from "@/lib/dashboard-context";
import { useDashboardData } from "@/lib/use-dashboard-data";
import { LENS_HINT, LENS_LABEL, euro, lensApplies, lensFor, type Lens } from "@/lib/segments";
import type { LayerData } from "@/lib/data/types";

/**
 * 8개 레이어가 공유하는 단 하나의 화면.
 *
 * 메인 지표 → 서브 지표 → 분해(대상 × 축) → 레이어 고유 표.
 * 레이어마다 달라지는 것은 전부 데이터 쪽에 있다 — 여기에 레이어 이름을 쓰지 말 것.
 */
export default function LayerPage() {
  const { slug } = useParams<{ slug: string }>();
  const { period, lens, setLens, setLensScope, cmpLabel } = useDashboard();
  const { data, error, loading } = useDashboardData<LayerData>(`layer/${slug}`, period, lens);
  const [axisId, setAxisId] = useState<string | null>(null);
  /** 자동 전환이 일어났을 때의 직전 관점 — 왜 바뀌었는지 말해 주기 위한 것 */
  const [autoFrom, setAutoFrom] = useState<Lens | null>(null);

  /* 탭을 옮기면 이전 탭의 전환 안내는 더 이상 맞는 말이 아니다 */
  useEffect(() => {
    setAutoFrom(null);
  }, [slug]);

  /**
   * 이 레이어에서 성립하지 않는 관점이면 성립하는 쪽으로 바꾼다.
   *
   * 그냥 두면 필터에는 "판매 관점" 이라 적혀 있는데 화면의 숫자는 구매 데이터인
   * 상태가 된다 — 필터가 화면과 다른 말을 하는 것이라 안내 문구로 덮을 문제가 아니다.
   */
  /* 상단 필터가 고를 수 있는 관점을 알 수 있도록 이 레이어의 범위를 올려 보낸다 */
  useEffect(() => {
    if (data) setLensScope(data.lensScope);
  }, [data, setLensScope]);

  useEffect(() => {
    if (!data) return;
    if (lensApplies(data.lensScope, lens)) return;
    const target = lensFor(data.lensScope);
    if (target === lens) return;
    setAutoFrom(lens);
    setLens(target);
  }, [data, lens, setLens]);

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
  /* 축에 묶인 표는 그 축을 보고 있을 때만 — 나머지는 항상 */
  const extras = (data.extras ?? []).filter((e) => !e.showOnAxis || e.showOnAxis === currentAxis);

  return (
    <div className="canvas">
      {/* 관점이 바뀌었으면 왜 바뀌었는지 먼저 말한다 — 말없이 바뀌면 고장으로 읽힌다 */}
      {autoFrom ? (
        <p className="lens-note lens-note-auto">
          <b>{LENS_LABEL[autoFrom]}</b>
          {euro(LENS_LABEL[autoFrom])}는 나뉘지 않는 지표라 <b>{LENS_LABEL[lens]}</b>
          {euro(LENS_LABEL[lens])} 바꿨습니다.
        </p>
      ) : data.lensNote ? (
        <p className="lens-note">
          <b>{LENS_LABEL[lens]}</b> — {data.lensNote}
        </p>
      ) : (
        lens !== "all" && (
          <p className="lens-note lens-note-on">
            <b>{LENS_LABEL[lens]}</b>
            {euro(LENS_LABEL[lens])} 좁혀 보고 있습니다. {LENS_HINT[lens]}
          </p>
        )
      )}
      <Band label="메인 지표" hint={cmpText} />
      <div className="r-hero">
        <Card title="" bare className="hero-card">
          <span className="hero-eyebrow">
            {m.eyebrow}
            <InfoTip metricId={m.metricId} />
          </span>
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
        >
          <div className="chart-wrap">
            <TrendChart
              series={data.trend.series}
              prevSeries={data.trend.prevSeries}
              prevLabel={cmpLabel(data.period)}
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
      <div
        className="subtiles"
        style={{ "--sub-cols": Math.ceil(data.subs.length / 2) || 1 } as CSSProperties}
      >
        {data.subs.map((s) => (
          <div className={`subtile ${s.delta.good ? "sg" : "sb"}`} key={s.name}>
            <span className="sn">
              {s.name}
              <InfoTip metricId={s.metricId} />
            </span>
            <span className="srow">
              <span className="sv num">{s.value}</span>
              <span className={`delta ${s.delta.good ? "d-good" : "d-bad"}`}>{s.delta.text}</span>
            </span>
            {s.spark && s.spark.length >= 2 && (
              <span className="ssp">
                <Sparkline
                  values={s.spark}
                  color={s.delta.good ? "var(--good)" : "var(--crit)"}
                  unit={s.sparkUnit ?? ""}
                  decimals={s.sparkDecimals ?? 0}
                />
              </span>
            )}
          </div>
        ))}
      </div>

      {data.funnel && (
        <>
          <Band label="퍼널" hint="어느 단계에서 얼마나 빠지는지" />
          <FunnelCard
            stages={data.funnel.stages}
            periodLabel={data.period.label}
            title={`${m.eyebrow} 퍼널`}
            footnote={data.funnel.footnote}
          />
        </>
      )}

      <Band label="분해" hint="대상을 고르고, 어떤 축으로 쪼갤지 고릅니다" />
      <BreakdownCard
        /* 레이어가 바뀌면 대상·축 선택을 초기화한다 */
        key={slug}
        breakdown={data.breakdown}
        periodLabel={data.period.label}
        onAxisChange={setAxisId}
      />

      {extras.map((t) => (
        <ExtraTableCard key={t.title} table={t} />
      ))}

      {data.leaderboards && data.leaderboards.length > 0 && (
        <>
          <Band label="TOP10" hint="개별 대상을 짚어서 봅니다" />
          <div className="lb-split">
            {data.leaderboards.map((b) => (
              <LeaderboardCard key={b.title} board={b} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
