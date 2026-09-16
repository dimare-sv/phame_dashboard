"use client";

import Stub from "@/components/Stub";
import MasterReportSection from "@/components/layer/MasterReportSection";
import { useDashboard } from "@/lib/dashboard-context";
import { useDashboardData } from "@/lib/use-dashboard-data";
import type { LayerData } from "@/lib/data/types";

/**
 * 8레이어 번호 체계 밖에 있는 독립 리포트 — 기획팀이 별도 문서로 돌리던
 * "활성 마스터 현황"을 그대로 옮긴 화면. 05 공급 안에 끼워 넣지 않고
 * 좌측 레일에 별도 대메뉴로 둔다.
 *
 * 데이터는 지금 mock 어댑터에서 05 공급 레이어에 붙어 나오지만(masterReport 필드),
 * 이 페이지는 그중 마스터 채널 리포트만 뽑아 쓴다 — 메인 지표·서브 지표·분해는 쓰지 않는다.
 */
export default function MasterChannelPage() {
  const { period, lens } = useDashboard();
  const { data, error, loading } = useDashboardData<LayerData>("layer/supply", period, lens);

  if (error) return <Stub />;
  if (loading || !data || !data.masterReport) {
    return (
      <div className="canvas">
        <p className="state">불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="canvas">
      <MasterReportSection data={data.masterReport} />
    </div>
  );
}
