"use client";

import Band from "@/components/Band";
import Card from "@/components/Card";
import TrendChart from "@/components/charts/TrendChart";
import YoyChart from "@/components/charts/YoyChart";
import Top20ShareChart from "@/components/charts/Top20ShareChart";
import ExtraTableCard from "@/components/layer/ExtraTableCard";
import MasterCohortTable from "@/components/layer/MasterCohortTable";
import type { MasterReportData } from "@/lib/data/types";

const FIXED = "기간 필터 비적용 · 월별 고정 데이터";

/**
 * 기획팀이 별도 HTML 문서로 돌리던 "활성 마스터 현황" 리포트에서 요소(KPI·표·추이·
 * YoY·코호트·집중도)만 가져온다. 카드·그리드 크기는 다른 메뉴에서 쓰는 규격 —
 * 서브 지표는 타일 그리드, 차트는 메인 지표 영역처럼 2개씩 짝지어 절반 크기로 둔다.
 */
export default function MasterReportSection({ data }: { data: MasterReportData }) {
  return (
    <>
      <Band label="마스터 채널 현황" hint={data.asOf} />

      <div className="mr-kpi-grid">
        {data.kpis.map((k) => (
          <div className="mr-kpi" key={k.label}>
            <span className="mr-kpi-label">{k.label}</span>
            <span className="mr-kpi-value num">{k.value}</span>
            <span className={`delta ${k.delta.good ? "d-good" : "d-bad"}`}>{k.delta.text}</span>
          </div>
        ))}
      </div>

      <ExtraTableCard table={data.monthly} />

      <Band label="월별 추이" hint="최근 12개월 · 기간 필터 비적용" />
      <div className="mr-charts">
        <Card title="활성 마스터 수" note="최근 12개월" fixedChip={FIXED}>
          <div className="chart-wrap">
            <TrendChart
              series={data.series.active}
              labels={data.series.months}
              unit="명"
              decimals={0}
              kind="bar"
              ariaLabel="활성 마스터 수 추이"
            />
          </div>
        </Card>
        <Card title="활성률" note="최근 12개월" fixedChip={FIXED}>
          <div className="chart-wrap">
            <TrendChart
              series={data.series.activeRate}
              labels={data.series.months}
              unit="%"
              decimals={1}
              kind="line"
              ariaLabel="활성률 추이"
            />
          </div>
        </Card>
        <Card title="총 GMV" note="최근 12개월" fixedChip={FIXED}>
          <div className="chart-wrap">
            <TrendChart
              series={data.series.gmv}
              labels={data.series.months}
              unit="억"
              decimals={1}
              kind="bar"
              ariaLabel="총 GMV 추이"
            />
          </div>
        </Card>
        <Card title="활성 마스터 1인당 GMV" note="최근 12개월" fixedChip={FIXED}>
          <div className="chart-wrap">
            <TrendChart
              series={data.series.gmvPerActive}
              labels={data.series.months}
              unit="만원"
              decimals={0}
              kind="line"
              ariaLabel="1인당 GMV 추이"
            />
          </div>
        </Card>
      </div>

      <Band label="전년 동기 비교" hint="올해(실선) · 작년(점선) · 기간 필터 비적용" />
      <div className="mr-charts">
        <Card title="활성 마스터 수 YoY" note="전년 동월 대비" fixedChip={FIXED}>
          <div className="chart-wrap">
            <YoyChart
              months={data.yoyActive.months}
              prevMonths={data.yoyActive.prevMonths}
              cur={data.yoyActive.cur}
              prev={data.yoyActive.prev}
              unit="명"
              decimals={0}
              ariaLabel="활성 마스터 수 YoY 비교"
            />
          </div>
        </Card>
        <Card title="총 GMV YoY" note="전년 동월 대비" fixedChip={FIXED}>
          <div className="chart-wrap">
            <YoyChart
              months={data.yoyGmv.months}
              prevMonths={data.yoyGmv.prevMonths}
              cur={data.yoyGmv.cur}
              prev={data.yoyGmv.prev}
              unit="억"
              decimals={1}
              ariaLabel="총 GMV YoY 비교"
            />
          </div>
        </Card>
      </div>

      <Band label="코호트 · 집중도" hint="기간 필터 비적용" />
      <Card title="승급 코호트 리텐션" note="승급월별 · 경과월 활성 유지율" fixedChip={FIXED}>
        <MasterCohortTable rows={data.cohorts} />
      </Card>

      <Card title="상위 20% GMV 집중도" note="활성 마스터 기준 · 월별" fixedChip={FIXED}>
        <div className="chart-wrap">
          <Top20ShareChart months={data.top20Share.months} share={data.top20Share.values} />
        </div>
      </Card>
    </>
  );
}
