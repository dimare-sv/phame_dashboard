import type { MetricDirection } from "@/lib/metrics/dictionary";

/**
 * 목표·임계값.
 *
 * 여기가 유일한 출처다. 개요 타일 하단의 "목표 70.0%", 타일의 경고 점,
 * "주의 필요" 카드가 전부 이 표에서 계산된다.
 * 값을 화면마다 따로 적어 두면 목표를 한 번 바꿀 때 세 군데가 어긋난다.
 */
export interface MetricGoal {
  /** 지표 사전의 id — 정의로 되돌아가는 고리 */
  metricId: string;
  /** 이 지표가 대표하는 레이어 (없으면 감시 전용 지표) */
  layerSlug?: string;
  name: string;
  /** 개요 타일 하단에 붙는 말 — "목표" / "임계" / "누적 회원" */
  footLabel: string;

  /**
   * 경고선. null 이면 비교 대상이 아니라 그냥 참고값이다
   * (누적 회원·연 누계처럼 "좋고 나쁨"이 없는 값).
   */
  value: number | null;
  /** 위험선 — 경고선보다 더 나간 값. 없으면 경고까지만 뜬다 */
  critValue?: number;
  /** value 가 null 일 때 타일 하단에 그대로 찍을 문구 */
  display?: string;

  unit: string;
  decimals: number;
  /** 올라가는 게 좋은 지표인가 — 임계 판정 방향이 이걸 따른다 */
  direction: Exclude<MetricDirection, "mixed">;
  /**
   * 경고를 언제 띄울지를 가른다.
   *
   * - `target` — 도달하려는 값. **미달해도 경고하지 않는다.** 목표는 늘 앞에 있는 것이라
   *   미달을 경고로 만들면 경고가 상시 켜지고, 그러면 아무도 안 본다.
   *   위험선을 넘었을 때만 경고한다.
   * - `limit` — 넘으면 지금 문제가 있다는 선. 넘는 즉시 경고한다.
   * - `reference` — 비교 대상이 아닌 참고값 (누적 회원·연 누계).
   */
  kind: "target" | "limit" | "reference";
}

export type Severity = "ok" | "warn" | "crit";

/**
 * 기본값.
 *
 * 이 숫자들은 **아직 합의된 값이 아니라 제안**이다. 설정 화면에서 바꿀 수 있고,
 * 바꾸는 즉시 개요의 경고와 타일이 다시 계산된다.
 */
export const DEFAULT_GOALS: MetricGoal[] = [
  {
    metricId: "acq-01",
    layerSlug: "acq",
    name: "신규 가입자",
    footLabel: "누적 회원",
    value: null,
    display: "24,180명",
    unit: "명",
    decimals: 0,
    direction: "higher",
    kind: "reference",
  },
  {
    metricId: "active-01",
    layerSlug: "active",
    name: "기능 활성률",
    footLabel: "목표",
    value: 70,
    critValue: 60,
    unit: "%",
    decimals: 1,
    direction: "higher",
    kind: "target",
  },
  {
    metricId: "convert-02",
    layerSlug: "convert",
    name: "구매 전환율",
    footLabel: "목표",
    value: 3.2,
    critValue: 2.5,
    unit: "%",
    decimals: 1,
    direction: "higher",
    /* 전환율이 목표 아래로 내려가면 지금 손을 대야 하는 사안이라 바로 경고한다 */
    kind: "limit",
  },
  {
    metricId: "retain-01",
    layerSlug: "retain",
    name: "D7 리텐션",
    footLabel: "목표",
    value: 35,
    critValue: 28,
    unit: "%",
    decimals: 1,
    direction: "higher",
    kind: "target",
  },
  {
    metricId: "supply-02",
    layerSlug: "supply",
    name: "미니샵 활성률",
    footLabel: "임계",
    value: 45,
    critValue: 40,
    unit: "%",
    decimals: 1,
    direction: "higher",
    kind: "limit",
  },
  {
    metricId: "trust-06",
    layerSlug: "trust",
    name: "CS 첫응답 시간",
    footLabel: "목표",
    value: 15,
    critValue: 20,
    unit: "분",
    decimals: 0,
    direction: "lower",
    /* 응답이 늦어지는 건 목표 미달이 아니라 지금 벌어지고 있는 문제다 */
    kind: "limit",
  },
  {
    metricId: "finance-01",
    layerSlug: "finance",
    name: "GMV",
    footLabel: "연 누계",
    value: null,
    display: "189.4억",
    unit: "억",
    decimals: 1,
    direction: "higher",
    kind: "reference",
  },
  {
    metricId: "system-01",
    layerSlug: "system",
    name: "크래시프리율",
    footLabel: "목표",
    value: 99.9,
    critValue: 99.5,
    unit: "%",
    decimals: 2,
    direction: "higher",
    kind: "target",
  },

  /* 레이어 메인은 아니지만 임계를 넘으면 바로 알아야 하는 것들 */
  {
    metricId: "active-17",
    layerSlug: "active",
    name: "검색 결과 없음 비율",
    footLabel: "임계",
    value: 15,
    critValue: 17,
    unit: "%",
    decimals: 1,
    direction: "lower",
    kind: "limit",
  },
  {
    metricId: "convert-06",
    layerSlug: "convert",
    name: "결제 실패율",
    footLabel: "임계",
    value: 3,
    critValue: 5,
    unit: "%",
    decimals: 1,
    direction: "lower",
    kind: "limit",
  },
];

/**
 * 목표·임계를 벗어났는지 판정한다. 방향에 따라 부등호가 뒤집힌다.
 *
 * 목표(target) 미달은 경고가 아니다 — 위험선을 넘었을 때만 경고한다.
 * 임계(limit)는 넘는 즉시 경고한다.
 */
export function evaluate(raw: number, goal: MetricGoal): Severity {
  if (goal.value === null) return "ok";
  const breached = (line: number) => (goal.direction === "higher" ? raw < line : raw >= line);
  if (goal.critValue !== undefined && breached(goal.critValue)) return "crit";
  if (goal.kind === "target") return "ok";
  return breached(goal.value) ? "warn" : "ok";
}

/** 목표에 못 미쳤는가 — 경고는 아니지만 타일에 표시해 줄 값 */
export function missesTarget(raw: number, goal: MetricGoal): boolean {
  if (goal.value === null || goal.kind !== "target") return false;
  return goal.direction === "higher" ? raw < goal.value : raw > goal.value;
}

export function formatGoalValue(v: number, goal: Pick<MetricGoal, "unit" | "decimals">) {
  return `${v.toFixed(goal.decimals)}${goal.unit}`;
}

/** 타일 하단에 찍히는 값 — 참고값이면 고정 문구, 아니면 목표·임계 */
export function goalFootValue(goal: MetricGoal): string {
  if (goal.value === null) return goal.display ?? "—";
  const base = formatGoalValue(goal.value, goal);
  /* 낮을수록 좋은 지표는 "15분" 보다 "15분 이내" 가 방향까지 말해준다 */
  return goal.direction === "lower" ? `${base} 이내` : base;
}

/**
 * 넘었을 때 "주의 필요"에 뭐라고 쓸지.
 * 타일 하단과 같은 말(footLabel)을 쓴다 — 같은 선을 두 화면이 다르게 부르면 안 된다.
 */
export function goalThresholdLabel(goal: MetricGoal): string {
  if (goal.value === null) return "—";
  return `${goal.footLabel} ${formatGoalValue(goal.value, goal)}`;
}
