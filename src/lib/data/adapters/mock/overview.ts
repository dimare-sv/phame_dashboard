/**
 * L0 개요 (더미).
 *
 * 타일 8개는 레이어 명세에서 그대로 뽑는다 — 개요의 숫자와 레이어 탭의 메인 지표가
 * 다르면 대시보드 전체를 못 믿게 되므로, 두 벌로 관리하지 않는다.
 */
import type { OverviewData, PeriodKey, PlatformData, Tile } from "../../types";
import { LAYER_SPECS } from "./layer-specs";
import { PERIODS, lensMetric, makeSeries, metricValue, relativeDelta, renderMetric } from "./build";
import { lensApplies, type Lens } from "@/lib/segments";

const P_INDEX: Record<PeriodKey, 0 | 1 | 2> = { d1: 0, d7: 1, d28: 2 };

const NORTH_STAR: Record<
  PeriodKey,
  { value: string; delta: { text: string; good: boolean }; cmpText: string; stickiness: string }
> = {
  d1: {
    value: "4,120",
    delta: { text: "▲ 3.1%", good: true },
    cmpText: "전일 3,996 대비 · +124명",
    stickiness: "30.4%",
  },
  d7: {
    value: "12,480",
    delta: { text: "▲ 8.2%", good: true },
    cmpText: "직전 7일 11,534 대비 · +946명",
    stickiness: "31.2%",
  },
  d28: {
    value: "39,980",
    delta: { text: "▲ 11.6%", good: true },
    cmpText: "직전 28일 35,824 대비 · +4,156명",
    stickiness: "31.9%",
  },
};

const WAU_TREND = [
  { week: "6/23", value: 9180 },
  { week: "6/30", value: 9420 },
  { week: "7/07", value: 9310 },
  { week: "7/14", value: 9760 },
  { week: "7/21", value: 10040 },
  { week: "7/28", value: 9980 },
  { week: "8/04", value: 10420 },
  { week: "8/11", value: 10880 },
  { week: "8/18", value: 11200 },
  { week: "8/25", value: 11540 },
  { week: "9/01", value: 11980 },
  { week: "9/08", value: 12480 },
];

const WAU_COMPOSITION = [
  { week: "6/23", keep: 5300, back: 1500, fresh: 2380 },
  { week: "6/30", keep: 5520, back: 1430, fresh: 2470 },
  { week: "7/07", keep: 5480, back: 1520, fresh: 2310 },
  { week: "7/14", keep: 5820, back: 1500, fresh: 2440 },
  { week: "7/21", keep: 6080, back: 1640, fresh: 2320 },
  { week: "7/28", keep: 6020, back: 1560, fresh: 2400 },
  { week: "8/04", keep: 6380, back: 1720, fresh: 2320 },
  { week: "8/11", keep: 6720, back: 1680, fresh: 2480 },
  { week: "8/18", keep: 7020, back: 1810, fresh: 2370 },
  { week: "8/25", keep: 7280, back: 1760, fresh: 2500 },
  { week: "9/01", keep: 7620, back: 1900, fresh: 2460 },
  { week: "9/08", keep: 7740, back: 1990, fresh: 2750 },
];

const COHORT: OverviewData["cohort"] = [
  { week: "8/04", size: 1180, values: [38, 27, 22, 18, 14] },
  { week: "8/11", size: 1240, values: [39, 28, 23, 18, 15] },
  { week: "8/18", size: 1320, values: [41, 30, 24, 19, null] },
  { week: "8/25", size: 1405, values: [40, 29, 25, null, null] },
  { week: "9/01", size: 1510, values: [43, 31, null, null, null] },
  { week: "9/08", size: 1204, values: [44, null, null, null, null] },
];

const FUNNEL_STAGES = [
  { name: "상품 상세 조회", event: "view_item" },
  { name: "장바구니 담기", event: "add_to_cart" },
  { name: "결제 시작", event: "begin_checkout" },
  { name: "결제 완료", event: "purchase" },
];

const FUNNEL_VALUES: Record<PeriodKey, number[]> = {
  d1: [6880, 2064, 1176, 929],
  d7: [48200, 14460, 8240, 6510],
  d28: [192400, 55800, 32360, 25890],
};

/**
 * 레이어 메인 지표가 아니면서 임계 감시가 필요한 것들.
 * 어댑터는 값만 내보내고, 위험한지 아닌지는 설정의 임계와 맞춰 화면에서 정한다.
 */
const WATCH_EXTRA: Record<PeriodKey, { metricId: string; name: string; raw: number; unit: string; decimals: number }[]> = {
  d1: [
    { metricId: "active-17", name: "검색 결과 없음 비율", raw: 18.4, unit: "%", decimals: 1 },
    { metricId: "convert-06", name: "결제 실패율", raw: 3.2, unit: "%", decimals: 1 },
  ],
  d7: [
    { metricId: "active-17", name: "검색 결과 없음 비율", raw: 17.2, unit: "%", decimals: 1 },
    { metricId: "convert-06", name: "결제 실패율", raw: 3.0, unit: "%", decimals: 1 },
  ],
  d28: [
    { metricId: "active-17", name: "검색 결과 없음 비율", raw: 15.8, unit: "%", decimals: 1 },
    { metricId: "convert-06", name: "결제 실패율", raw: 2.9, unit: "%", decimals: 1 },
  ],
};

const HIGHLIGHTS = [
  "검색 무결과 1위 키워드 <b>재생크림</b> — 상품 수급 검토 필요",
  "피드 등록 <b>주간 최고치</b> 갱신 (412건)",
  "결제 실패 급증 구간 <b>9/11 14~16시</b>",
  "신규 미니샵 38개 중 <b>9개</b>만 첫 주문 발생",
];

const PLATFORM_COLUMNS = ["iOS", "Android", "Web"];
const PLATFORM_COLORS = ["#2E6FB7", "#C0660A", "#A03A8F"];

const PLATFORM: Record<PeriodKey, Pick<PlatformData, "base" | "users" | "rows">> = {
  d1: {
    base: "DAU 기준",
    users: [1735, 1928, 457],
    rows: [
      { name: "구매 전환율", values: [3.1, 2.6, 2.4], unit: "%", decimals: 1, higherIsBetter: true, gapWarn: 0.5 },
      { name: "결제 실패율", values: [2.4, 3.8, 3.1], unit: "%", decimals: 1, higherIsBetter: false, gapWarn: 1.0 },
      { name: "평균 세션", values: [492, 461, 295], unit: "s", decimals: 0, higherIsBetter: true, gapWarn: 120 },
      { name: "크래시프리율", values: [99.71, 99.54, null], unit: "%", decimals: 2, higherIsBetter: true, gapWarn: 0.15 },
    ],
  },
  d7: {
    base: "WAU 기준",
    users: [5254, 5840, 1386],
    rows: [
      { name: "구매 전환율", values: [3.2, 2.7, 2.5], unit: "%", decimals: 1, higherIsBetter: true, gapWarn: 0.5 },
      { name: "결제 실패율", values: [2.3, 3.6, 3.0], unit: "%", decimals: 1, higherIsBetter: false, gapWarn: 1.0 },
      { name: "평균 세션", values: [484, 453, 288], unit: "s", decimals: 0, higherIsBetter: true, gapWarn: 120 },
      { name: "크래시프리율", values: [99.74, 99.58, null], unit: "%", decimals: 2, higherIsBetter: true, gapWarn: 0.15 },
    ],
  },
  d28: {
    base: "MAU 기준",
    users: [16830, 18710, 4440],
    rows: [
      { name: "구매 전환율", values: [3.3, 2.8, 2.6], unit: "%", decimals: 1, higherIsBetter: true, gapWarn: 0.5 },
      { name: "결제 실패율", values: [2.1, 3.4, 2.9], unit: "%", decimals: 1, higherIsBetter: false, gapWarn: 1.0 },
      { name: "평균 세션", values: [478, 446, 282], unit: "s", decimals: 0, higherIsBetter: true, gapWarn: 120 },
      { name: "크래시프리율", values: [99.78, 99.63, null], unit: "%", decimals: 2, higherIsBetter: true, gapWarn: 0.15 },
    ],
  },
};

function buildTiles(period: PeriodKey, lens: Lens): Tile[] {
  return LAYER_SPECS.map((spec) => {
    /* 타일도 레이어와 같은 관점으로 좁힌다 — 개요와 탭의 숫자가 갈리면 안 된다 */
    const main = lensMetric(spec.main, lens, spec.lens);
    const r = renderMetric(main, period);
    return {
      idx: spec.idx,
      name: spec.eyebrow,
      value: r.value,
      delta: r.delta,
      spark: makeSeries(
        metricValue(main, period),
        relativeDelta(main, period),
        `${spec.id}tile${period}${lens}`,
        8,
      ),
      href: `/layer/${spec.id}`,
      metricId: spec.metricId,
      raw: metricValue(main, period),
      lensNA: lens !== "all" && !lensApplies(spec.lens?.scope ?? "none", lens),
    };
  });
}

function buildWatch(period: PeriodKey, lens: Lens): OverviewData["watch"] {
  const fromTiles = LAYER_SPECS.map((spec) => ({
    metricId: spec.metricId,
    name: spec.eyebrow,
    raw: metricValue(lensMetric(spec.main, lens, spec.lens), period),
    unit: spec.mainUnit,
    decimals: spec.mainDecimals,
  }));
  return [...fromTiles, ...WATCH_EXTRA[period]];
}

export function buildOverview(period: PeriodKey, asOf: string, lens: Lens = "all"): OverviewData {
  const pf = PLATFORM[period];
  return {
    period: PERIODS[period],
    asOf,
    northStar: {
      eyebrow: "주간 활성 유저",
      name: "WAU · L3 기준 (의미 있는 액션 1회 이상)",
      value: NORTH_STAR[period].value,
      delta: NORTH_STAR[period].delta,
      cmpText: NORTH_STAR[period].cmpText,
      composition: [
        { label: "유지", pct: 62, color: "var(--s-keep)" },
        { label: "신규", pct: 22, color: "var(--s-new)" },
        { label: "복귀", pct: 16, color: "var(--s-back)" },
      ],
      stickiness: NORTH_STAR[period].stickiness,
      byUserType: { value: "— / —", available: false, pendingLabel: "user_type 대기" },
    },
    wauTrend: WAU_TREND,
    wauComposition: WAU_COMPOSITION,
    tiles: buildTiles(period, lens),
    platform: { ...pf, columns: PLATFORM_COLUMNS, colors: PLATFORM_COLORS },
    funnel: FUNNEL_STAGES.map((s, i) => ({ ...s, value: FUNNEL_VALUES[period][i] })),
    cohort: COHORT,
    watch: buildWatch(period, lens),
    highlights: HIGHLIGHTS,
  };
}
