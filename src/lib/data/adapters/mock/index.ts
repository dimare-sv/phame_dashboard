/**
 * 더미 어댑터.
 *
 * 실데이터가 붙어도 이 파일은 지우지 않는다 — 로컬 개발과 시안 캡처에 계속 쓴다.
 * (DATA_SOURCE=mock)
 */
import type { DashboardSource, LayerData, PeriodKey } from "../../types";
import type { Lens } from "@/lib/segments";
import { buildLayer } from "./build";
import { LAYER_SPECS } from "./layer-specs";
import { buildOverview } from "./overview";

const AS_OF = "2026-09-13 06:00";

export const mockSource: DashboardSource = {
  name: "mock",

  async getOverview(period: PeriodKey, lens: Lens) {
    return buildOverview(period, AS_OF, lens);
  },

  async getLayer(layerId: string, period: PeriodKey, lens: Lens): Promise<LayerData | null> {
    const spec = LAYER_SPECS.find((s) => s.id === layerId);
    return spec ? buildLayer(spec, period, AS_OF, lens) : null;
  },
};
