"use client";

import Band from "@/components/Band";
import Card from "@/components/Card";
import WauTrendChart from "@/components/charts/WauTrendChart";
import WauStackChart from "@/components/charts/WauStackChart";
import Tiles from "@/components/overview/Tiles";
import PlatformCard from "@/components/overview/PlatformCard";
import FunnelCard from "@/components/overview/FunnelCard";
import CohortCard from "@/components/overview/CohortCard";
import AlertsCard from "@/components/overview/AlertsCard";
import { useDashboard } from "@/lib/dashboard-context";
import { useDashboardData } from "@/lib/use-dashboard-data";
import type { OverviewData } from "@/lib/data/types";

export default function OverviewPage() {
  const { period, lens, cmpLabel } = useDashboard();
  const { data, error, loading } = useDashboardData<OverviewData>("overview", period, lens);

  if (error) return <div className="canvas"><p className="state err">{error}</p></div>;
  if (loading || !data) return <div className="canvas"><p className="state">불러오는 중…</p></div>;

  const ns = data.northStar;
  const cmpText = `${data.period.range} · ${cmpLabel(data.period)} 대비`;

  return (
    <div className="canvas">
      <Band label="North Star" />
      <div className="r-hero">
        <Card title="" bare className="hero-card" captureName="NorthStar">
          <span className="hero-eyebrow">{ns.eyebrow}</span>
          <span className="hero-name">{ns.name}</span>
          <span className="hero-val num">{ns.value}</span>
          <span style={{ marginTop: 9 }}>
            <span className={`delta ${ns.delta.good ? "d-good" : "d-bad"}`}>{ns.delta.text}</span>
          </span>
          <span className="hero-cmp">{ns.cmpText}</span>

          <div className="hero-split">
            <div className="split-lbl">구성</div>
            <div
              className="split-bar"
              role="img"
              aria-label={`WAU 구성 — ${ns.composition.map((c) => `${c.label} ${c.pct}%`).join(", ")}`}
            >
              {ns.composition.map((c) => (
                <i key={c.label} style={{ background: c.color, width: `${c.pct}%` }} />
              ))}
            </div>
            <div className="split-keys">
              {ns.composition.map((c) => (
                <span key={c.label}>
                  <i className="sw" style={{ background: c.color }} />
                  {c.label} <b>{c.pct}%</b>
                </span>
              ))}
            </div>
          </div>

          <div className="hero-sub">
            <div>
              <span className="k">Stickiness</span>
              <span className="v num">{ns.stickiness}</span>
            </div>
            <div>
              <span className="k">구매자 / 판매자</span>
              <span className={`v num${ns.byUserType.available ? "" : " na"}`}>
                {ns.byUserType.value}
              </span>
              {!ns.byUserType.available && ns.byUserType.pendingLabel && (
                <span className="pending">{ns.byUserType.pendingLabel}</span>
              )}
            </div>
          </div>
        </Card>

        <Card
          title="WAU 추이"
          note={`최근 ${data.wauTrend.length}주`}
          fixedChip="기간 필터 비적용"
          className="chart-card"
          captureName="WAU추이"
        >
          <div className="chart-wrap">
            <WauTrendChart points={data.wauTrend} />
          </div>
        </Card>
      </div>

      <Band label="레이어별 요약" hint={cmpText} />
      <Tiles tiles={data.tiles} />

      <Band label="플랫폼별 현황" hint="플랫폼 간 격차가 곧 개선 대상입니다" />
      <PlatformCard platform={data.platform} periodLabel={data.period.label} />

      <div className="r-split">
        <Card
          title="WAU 구성 추이"
          note={`신규 · 복귀 · 유지 / ${data.wauComposition.length}주`}
          fixedChip="기간 필터 비적용"
          captureName="WAU구성추이"
        >
          <div className="chart-wrap" style={{ padding: "0 18px 16px" }}>
            <WauStackChart points={data.wauComposition} />
            <div className="split-keys" style={{ paddingLeft: 42 }}>
              <span>
                <i className="sw" style={{ background: "var(--s-keep)" }} />
                유지
              </span>
              <span>
                <i className="sw" style={{ background: "var(--s-back)" }} />
                복귀
              </span>
              <span>
                <i className="sw" style={{ background: "var(--s-new)" }} />
                신규
              </span>
            </div>
          </div>
        </Card>

        <FunnelCard stages={data.funnel} periodLabel={data.period.label} />
      </div>

      <div className="r-split">
        <CohortCard rows={data.cohort} />
        <AlertsCard watch={data.watch} highlights={data.highlights} />
      </div>
    </div>
  );
}
