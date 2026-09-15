/**
 * 파메의 사용자 구분 — 유일한 출처.
 *
 * 등급은 하나의 사다리가 아니다. `파머 → 파머셀러` 에서 **역할이 바뀐다**.
 * 그 앞은 구매자, 그 뒤는 판매자다. 같은 색 램프에 5개를 늘어놓으면
 * 이 경계가 지워지고 "한 칸씩 올라가는 회원 등급"으로 읽힌다.
 *
 * 그리고 **판매자도 구매를 한다**. 그래서 구매/판매는 배타적 분류가 아니라
 * 겹치는 역할이다 — 둘을 더해도 전체가 되지 않는다. 화면은 이 사실을 숨기면 안 된다.
 */

/** 등급이 속한 쪽 */
export type Side = "guest" | "buyer" | "seller";

export interface Grade {
  id: string;
  label: string;
  side: Side;
  /** 회원 테이블에 존재하는가 — 비회원은 없다 */
  member: boolean;
}

export const GRADES: Grade[] = [
  { id: "guest", label: "비회원", side: "guest", member: false },
  { id: "pharmer", label: "파머", side: "buyer", member: true },
  { id: "seller", label: "파머셀러", side: "seller", member: true },
  { id: "premaster", label: "프리마스터", side: "seller", member: true },
  { id: "master", label: "마스터", side: "seller", member: true },
  { id: "maniac", label: "파매니악", side: "seller", member: true },
];

/** 회원 등급만 (누적 회원처럼 회원 테이블을 세는 지표의 분해 축) */
export const MEMBER_GRADES = GRADES.filter((g) => g.member);
/** 판매자 등급만 — 05 공급이 쓰는 축 */
export const SELLER_GRADES = GRADES.filter((g) => g.side === "seller");

export const GRADE_LABELS = GRADES.map((g) => g.label);
export const MEMBER_GRADE_LABELS = MEMBER_GRADES.map((g) => g.label);
export const SELLER_GRADE_LABELS = SELLER_GRADES.map((g) => g.label);

export function sideOf(label: string): Side | null {
  return GRADES.find((g) => g.label === label)?.side ?? null;
}

/* ── 관점(렌즈) ──────────────────────────────────────────────── */

/**
 * 대시보드를 어느 쪽 눈으로 볼 것인가.
 *
 * **세그먼트가 아니라 관점이다.** 판매자도 구매하므로 demand 와 supply 는
 * 겹치고, 두 값을 더해도 all 이 되지 않는다. 라벨을 "구매자 / 판매자" 로 쓰면
 * 보는 사람이 합을 100% 로 기대하게 되므로 "구매 관점 / 판매 관점" 으로 쓴다.
 */
export const LENSES = ["all", "demand", "supply"] as const;
export type Lens = (typeof LENSES)[number];

export const LENS_LABEL: Record<Lens, string> = {
  all: "전체",
  demand: "구매 관점",
  supply: "판매 관점",
};

export const LENS_HINT: Record<Lens, string> = {
  all: "구매·판매를 나누지 않은 전체 값",
  demand: "구매 행동 기준 — 비회원과 파머, 그리고 구매를 한 판매자가 모두 포함됩니다",
  supply: "판매 행동 기준 — 파머셀러 이상. 구매 관점과 인원이 겹칩니다",
};

export function isLens(v: string): v is Lens {
  return (LENSES as readonly string[]).includes(v);
}

/**
 * 레이어가 관점 구분을 지원하는 범위.
 *
 * `none` 은 "아직 안 만들었다" 가 아니라 **역할과 무관한 지표**라는 뜻이다.
 * 크래시프리율에 구매/판매를 묻는 것은 질문 자체가 성립하지 않는다.
 */
export type LensScope = "both" | "demand" | "supply" | "none";

export const LENS_SCOPE_NOTE: Record<Exclude<LensScope, "both">, string> = {
  demand: "구매 관점 지표입니다. 판매 관점으로는 나뉘지 않습니다.",
  supply: "판매 관점 지표입니다. 구매 관점으로는 나뉘지 않습니다.",
  none: "역할과 무관한 지표입니다. 관점 필터가 적용되지 않습니다.",
};

/**
 * 이 레이어에서 성립하는 관점.
 *
 * 구매 전용 레이어를 판매 관점으로 열어 두면, 필터에는 "판매 관점" 이라 적혀 있는데
 * 화면의 숫자는 구매 데이터다. 필터가 화면과 다른 말을 하는 상태라 자동으로 맞춘다.
 */
export function lensFor(scope: LensScope): Lens {
  if (scope === "demand") return "demand";
  if (scope === "supply") return "supply";
  /* both 는 어느 쪽이든 되므로 호출부에서 걸러지고, none 은 나눌 수 없으니 전체 */
  return "all";
}

/**
 * 받침에 맞는 조사를 고른다 — "전체으로" 가 아니라 "전체로".
 * 관점 이름이 늘어나면 손으로 맞추기 어려우므로 계산한다.
 */
export function euro(word: string): "로" | "으로" {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return "로";
  const jong = (code - 0xac00) % 28;
  /* 받침이 없거나(0) ㄹ 받침(8)이면 "로" */
  return jong === 0 || jong === 8 ? "로" : "으로";
}

/** 이 레이어에서 그 관점이 의미가 있는가 */
export function lensApplies(scope: LensScope, lens: Lens): boolean {
  if (lens === "all") return true;
  if (scope === "both") return true;
  return scope === lens;
}
