import type { Lens, LensScope } from "@/lib/segments";

/**
 * 대시보드 도메인 타입.
 *
 * 화면은 이 타입만 알고, 데이터가 GA4에서 오는지 DB에서 오는지 더미인지는 모른다.
 * 어댑터를 갈아끼울 때 화면 코드가 바뀌지 않도록 하는 것이 이 파일의 목적이다.
 *
 * 값은 전부 **표시용 문자열**로 내려온다. 단위·자릿수·반올림을 어디서 정할지
 * 화면과 어댑터가 나눠 갖기 시작하면 같은 지표가 탭마다 다르게 보이기 때문이다.
 */

export const PERIOD_KEYS = ["d1", "d7", "d28"] as const;
export type PeriodKey = (typeof PERIOD_KEYS)[number];

export type CompareMode = "prev" | "yoy";

export function isPeriodKey(v: string | null): v is PeriodKey {
  return v !== null && (PERIOD_KEYS as readonly string[]).includes(v);
}

/** 기간 한 벌의 표기 정보. 비교 라벨(전일/직전 7일…)도 여기서 나온다. */
export interface PeriodMeta {
  key: PeriodKey;
  /** 탭에 찍히는 이름 — "최근 7일" */
  label: string;
  /** 실제 집계 구간 — "9/06~9/12" */
  range: string;
  /** 직전 기간 비교 라벨 — "직전 7일" */
  cmp: string;
  /** 전년 동기 비교 라벨 — "전년 동기" */
  cmpYoy: string;
}

/**
 * 증감 표기.
 *
 * `good` 은 "좋아졌는가"이지 "올라갔는가"가 아니다.
 * CS 첫응답 시간처럼 lower_is_better 지표는 ▼가 good:true 다.
 * 색은 반드시 이 필드를 따른다 — 화살표 방향으로 색을 칠하면 안 된다.
 */
export interface Delta {
  text: string;
  good: boolean;
}

/** L0 개요 타일 하나. 각 타일은 해당 레이어 탭의 메인 지표와 같은 값이다. */
export interface Tile {
  idx: string;
  name: string;
  value: string;
  delta: Delta;
  /** 스파크라인 원본 값 (정규화는 렌더러가 한다) */
  spark: number[];
  /** 스파크라인 호버 시 각 점을 이 단위·자릿수로 읽는다 — 메인 지표와 같은 규칙이어야 한다 */
  sparkUnit: string;
  sparkDecimals: number;
  /** 이 타일이 대표하는 레이어 탭 */
  href: string;
  /** 지표 사전의 id — 목표·임계를 찾아오는 열쇠 */
  metricId: string;
  /**
   * 포맷 전 숫자.
   * 목표 대비 판정을 화면에서 하기 때문에 필요하다 — 설정에서 목표를 바꾸면
   * 서버를 다시 부르지 않고 경고가 갱신되어야 한다.
   */
  raw: number;
  /** 관점을 골랐지만 이 지표에는 적용되지 않음 — 전체 값이 그대로 보인다는 표시 */
  lensNA?: boolean;
}

export interface CompositionSlice {
  label: string;
  pct: number;
  color: string;
}

export interface NorthStar {
  eyebrow: string;
  name: string;
  value: string;
  delta: Delta;
  /** "직전 7일 11,534 대비 · +946명" */
  cmpText: string;
  composition: CompositionSlice[];
  stickiness: string;
  /** user_type 파라미터가 붙기 전까지는 산출 불가 */
  byUserType: { value: string; available: boolean; pendingLabel?: string };
}

export interface WauPoint {
  week: string;
  value: number;
}

export interface WauCompositionPoint {
  week: string;
  keep: number;
  back: number;
  fresh: number;
}

export interface FunnelStage {
  name: string;
  event: string;
  value: number;
}

export interface CohortRow {
  week: string;
  size: number;
  /** D1 / D3 / D7 / D14 / D30 — 아직 기간 미도래면 null */
  values: (number | null)[];
}

/**
 * 임계 판정 대상 지표의 현재 값.
 *
 * 어댑터는 "무엇이 위험한지"를 판단하지 않는다 — 값만 준다.
 * 판단은 설정의 목표·임계와 화면에서 맞춰 보고 내린다.
 */
export interface WatchValue {
  /** 지표 사전의 id */
  metricId: string;
  name: string;
  raw: number;
  unit: string;
  decimals: number;
}

/** 플랫폼은 "비중"보다 "격차"를 보는 축이다. gapWarn 을 넘으면 개선 대상. */
export interface PlatformRow {
  name: string;
  values: (number | null)[];
  unit: "%" | "s";
  decimals: number;
  higherIsBetter: boolean;
  gapWarn: number;
}

export interface PlatformData {
  /** DAU/WAU/MAU 중 어느 모수인지 */
  base: string;
  columns: string[];
  colors: string[];
  users: number[];
  rows: PlatformRow[];
}

export interface OverviewData {
  period: PeriodMeta;
  asOf: string;
  northStar: NorthStar;
  /** 주 단위 지표 — 상단 기간 필터를 따르지 않는다 */
  wauTrend: WauPoint[];
  wauComposition: WauCompositionPoint[];
  tiles: Tile[];
  platform: PlatformData;
  funnel: FunnelStage[];
  /** 가입 주차가 기준축이라 기간 필터를 따르지 않는다 */
  cohort: CohortRow[];
  /** 목표·임계와 맞춰 볼 지표들 — 타일 8개 + 추가 감시 지표 */
  watch: WatchValue[];
  highlights: string[];
}

/* ------------------------------------------------------------------ */
/* L1 레이어 — 메인 지표 → 서브 지표 → 분해(대상 × 축)                 */
/*                                                                     */
/* 8개 레이어가 전부 이 구조를 쓴다. 레이어마다 달라지는 것은          */
/* 지표 이름과 분해 축뿐이고, 화면 코드는 하나다.                      */
/* ------------------------------------------------------------------ */

export interface SubTile {
  name: string;
  value: string;
  delta: Delta;
  /** 지표 사전의 id — 있으면 제목 옆 정보 아이콘이 정의·계산식을 띄운다 */
  metricId?: string;
}

/**
 * 분해 대상. "무엇을" 쪼갤지.
 *
 * 기간에 따라 변하는 양(flow: 신규 가입자)과 기준일 잔액(stock: 누적 회원)이 섞인다.
 * `fixedPeriod` 가 붙은 대상은 상단 기간 필터를 따르지 않으므로 화면에 배지를 단다.
 */
export interface BreakdownTarget {
  id: string;
  label: string;
  /** 표시용 총계 — 도넛 가운데 숫자 */
  total: number;
  /** 단위 — "명" / "건" / "만원" */
  unit: string;
  fixedPeriod?: boolean;
}

/** 분해 축. "어떻게" 쪼갤지. */
export interface BreakdownAxis {
  id: string;
  label: string;
  items: string[];
  /** 대상 id → 항목별 비율 (합 1.0). 대상마다 분포가 다르다. */
  ratios: Record<string, number[]>;
  deltas: Delta[];
  /** 순서가 있는 축(등급·가격대·별점)은 단일 색상 램프를 쓴다 */
  ordinal?: boolean;
  /** 중간에 역할 경계가 있는 축(등급) — 색을 두 계열로 나눈다 */
  roleSplit?: boolean;
  /**
   * 항목 라벨 → 고정 색. 가입방식처럼 실제 서비스 브랜드가 있는 축에 쓴다
   * ("카카오"는 카카오 노란색). CVD 분리는 통과하지만 톤 자체가 카테고리 팔레트의
   * 명도·채도 규칙 밖에 있을 수 있다 — 범례·표에 항상 라벨이 같이 있어야 한다.
   */
  colors?: Record<string, string>;
  /** 대상 id → 이 조합에만 붙는 선행조건 경고 */
  caveats?: Record<string, string>;
}

export interface Breakdown {
  targets: BreakdownTarget[];
  axes: BreakdownAxis[];
}

/**
 * 레이어마다 하나씩 붙는 고유 표.
 * (획득의 등급 승급 처리, 전환의 결제 실패 사유 …)
 */
export interface ExtraTable {
  title: string;
  note?: string;
  columns: { key: string; label: string; left?: boolean }[];
  /** hot 에 담긴 열은 경고색으로 칠한다 — 임계 판정은 어댑터가 한다 */
  rows: { cells: Record<string, string>; hot?: string[] }[];
  /** 합계 행 — 없으면 그리지 않는다 */
  total?: Record<string, string>;
  /** 표 아래 한 줄 해설. <b> 허용 */
  footnote?: string;
  /** 이 축을 보고 있을 때만 표시. 없으면 항상 표시 */
  showOnAxis?: string;
}

export interface LayerData {
  /** 이 레이어가 구매/판매 관점을 지원하는 범위 */
  lensScope: LensScope;
  /** 관점이 적용되지 않을 때 화면에 띄울 사유 — 적용되면 undefined */
  lensNote?: string;
  /** 레일의 번호 — "01" */
  idx: string;
  title: string;
  period: PeriodMeta;
  asOf: string;
  main: {
    eyebrow: string;
    /** 정의 한 줄 — "가입 완료 기준 · sign_up" */
    name: string;
    value: string;
    delta: Delta;
    /** 하단 2칸 보조값 */
    footer: { k: string; v: string; pending?: string }[];
    /** 지표 사전의 id — 있으면 제목 옆 정보 아이콘이 정의·계산식을 띄운다 */
    metricId: string;
  };
  trend: {
    granularity: string;
    /** 좌 / 중 / 우 3개만 찍는다 — 12개를 다 찍으면 읽히지 않는다 */
    labels: [string, string, string];
    series: number[];
    unit: string;
    decimals: number;
    /**
     * 막대는 0을 바닥으로 읽히므로, 값의 변동폭이 값 자체에 비해 아주 작은 지표
     * (크래시프리율 99.6x% 같은)는 막대로 그리면 전부 같은 높이가 된다.
     * 그런 경우에만 선으로 그린다 — 막대의 축을 자르는 것보다 정직하다.
     */
    kind: "bar" | "line";
  };
  subs: SubTile[];
  breakdown: Breakdown;
  /** 레이어 고유 표. 여러 개를 둘 수 있다 — showOnAxis 로 축에 묶인 표는 그 축일 때만 나온다 */
  extras?: ExtraTable[];
}

/** 어댑터가 구현해야 하는 계약. mock / ga4 / db 가 이걸 각각 구현한다. */
export interface DashboardSource {
  readonly name: string;
  getOverview(period: PeriodKey, lens: Lens): Promise<OverviewData>;
  /** layerId 는 레일의 슬러그 — acq / active / convert / … */
  getLayer(layerId: string, period: PeriodKey, lens: Lens): Promise<LayerData | null>;
}
