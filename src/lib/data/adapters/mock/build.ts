/**
 * 더미 레이어를 만드는 엔진.
 *
 * 8개 레이어를 각각 손으로 쓰면 기간을 바꿀 때마다 수치가 따로 놀고,
 * 어느 지표가 lower_is_better 인지도 레이어마다 달라진다.
 * 그래서 레이어는 "지표 명세"만 쓰고, 기간 반영·단위·증감색은 전부 여기서 처리한다.
 */
import { fmt, mmss } from "@/lib/format";
import { lensApplies, LENS_SCOPE_NOTE, type Lens, type LensScope } from "@/lib/segments";
import type {
  Breakdown,
  BreakdownAxis,
  Delta,
  ExtraTable,
  LayerData,
  PeriodKey,
  PeriodMeta,
  SubTile,
} from "../../types";

/* ------------------------------ 단위 ------------------------------ */

export type Kind =
  | "count" // 건수 — 1,204명
  | "rate" // 비율 — 67.2%
  | "rate2" // 소수점 둘째까지 — 99.66%
  | "min" // 분 — 18분
  | "sec" // m:ss — 8:04
  | "hour" // 시간 — 4.2시간
  | "eok" // 억 — 13.4억
  | "manwon" // 만원 — 134,000만원
  | "score" // 점수 — 4.32
  | "days" // 일 — 1.8일
  | "num1"; // 소수점 한 자리 맨숫자 — 12.4

export function fmtValue(v: number, kind: Kind, unit = ""): string {
  switch (kind) {
    case "count":
      return fmt(Math.round(v)) + unit;
    case "rate":
      return `${v.toFixed(1)}%`;
    case "rate2":
      return `${v.toFixed(2)}%`;
    case "min":
      return `${Math.round(v)}분`;
    case "sec":
      return mmss(v);
    case "hour":
      return `${v.toFixed(1)}시간`;
    case "eok":
      return `${v.toFixed(1)}억`;
    case "manwon":
      return `${fmt(Math.round(v))}만원`;
    case "score":
      return v.toFixed(2);
    case "days":
      return `${v.toFixed(1)}일`;
    case "num1":
      return v.toFixed(1) + unit;
  }
}

/**
 * 증감 문구와 색.
 *
 * `up` 은 "올라가면 좋은 지표인가"다. 화살표는 값의 방향을,
 * 색은 개선 여부를 따른다 — 둘은 일치하지 않을 수 있다.
 */
export function makeDelta(d: number, kind: Kind, up = true, unit = ""): Delta {
  const arrow = d >= 0 ? "▲" : "▼";
  const a = Math.abs(d);
  let body: string;
  /* 비율 지표의 증감은 %가 아니라 %p다. 소수 자릿수는 값과 같게 맞춘다 —
     99.66% 지표의 -0.04 를 "0.0%p" 로 쓰면 변화가 없는 것처럼 읽힌다. */
  if (kind === "rate") body = `${a.toFixed(1)}%p`;
  else if (kind === "rate2") body = `${a.toFixed(2)}%p`;
  else if (kind === "num1") body = a.toFixed(1) + unit;
  else if (kind === "min") body = `${Math.round(a)}분`;
  else if (kind === "days") body = `${a.toFixed(1)}일`;
  else if (kind === "score") body = a.toFixed(2);
  else if (kind === "hour") body = `${a.toFixed(1)}시간`;
  else body = `${a.toFixed(1)}%`;
  return { text: `${arrow} ${body}`, good: d === 0 ? true : d > 0 === up };
}

/* --------------------------- 기간 반영 --------------------------- */

/** 건수형 지표에 적용하는 기간 배수. 어제 ≒ 주간의 1/6.6, 28일 ≒ 4주. */
const SCALE: Record<PeriodKey, number> = { d1: 0.151, d7: 1, d28: 3.92 };
const P_INDEX: Record<PeriodKey, 0 | 1 | 2> = { d1: 0, d7: 1, d28: 2 };

export const PERIODS: Record<PeriodKey, PeriodMeta> = {
  d1: { key: "d1", label: "어제", range: "9/12", cmp: "전일", cmpYoy: "전년 동일" },
  d7: { key: "d7", label: "최근 7일", range: "9/06~9/12", cmp: "직전 7일", cmpYoy: "전년 동기" },
  d28: { key: "d28", label: "최근 28일", range: "8/16~9/12", cmp: "직전 28일", cmpYoy: "전년 동기" },
};

/** 추이 차트의 x축 — 기간에 따라 눈금 단위가 바뀐다 */
const GRAN: Record<PeriodKey, { label: string; labels: [string, string, string] }> = {
  d1: { label: "최근 12일", labels: ["9/01", "9/06", "9/12"] },
  d7: { label: "최근 12주", labels: ["6/23", "8/04", "9/08"] },
  d28: { label: "최근 12개월", labels: ["25/10", "26/04", "26/09"] },
};

/* ------------------------------ 명세 ------------------------------ */

export interface MetricSpec {
  name: string;
  kind: Kind;
  /** count 계열의 접미사 */
  unit?: string;
  /** 최근 7일 기준값. 건수형이면 기간 배수가 적용된다 */
  v: number;
  /** 기간에 비례하는 양인지 (비율·시간 지표는 false) */
  flow?: boolean;
  /** 기간별 값을 직접 지정 — 비율형처럼 배수로 안 되는 경우 */
  vp?: [number, number, number];
  /** [어제, 최근7일, 최근28일] 증감 */
  d: [number, number, number];
  /** 올라가면 좋은 지표인가 (기본 true) */
  up?: boolean;
  /** 값 앞에 붙일 기호 — 순증감의 "+" */
  prefix?: string;
}

export function metricValue(m: MetricSpec, p: PeriodKey): number {
  if (m.vp) return m.vp[P_INDEX[p]];
  return m.flow ? m.v * SCALE[p] : m.v;
}

export function renderMetric(m: MetricSpec, p: PeriodKey): { value: string; delta: Delta } {
  const raw = metricValue(m, p);
  return {
    value: (m.prefix ?? "") + fmtValue(raw, m.kind, m.unit),
    delta: makeDelta(m.d[P_INDEX[p]], m.kind, m.up, m.unit),
  };
}

/* ------------------------------ 추이 ------------------------------ */

/** 렌더마다 값이 흔들리면 안 되므로 시드 기반으로 고정한다 */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h, 48271) % 2147483647;
    return (h & 0x7fffffff) / 2147483647;
  };
}

/**
 * 마지막 점이 현재 값과 정확히 같은, 완만한 추세선을 만든다.
 *
 * `deltaPct` 는 반드시 **상대 변화율(%)** 이어야 한다. 증감을 %p·분 단위 그대로
 * 넣으면 99.66% 같은 지표에서 흔들림이 값 자체만큼 커져 차트가 망가진다.
 * 흔들림도 값이 아니라 추세폭에 비례시킨다 — 같은 이유다.
 */
export function makeSeries(
  end: number,
  deltaPct: number,
  seed: string,
  n = 12,
  clampTo100 = false,
): number[] {
  const rnd = seeded(seed);
  const drift = Math.max(-0.3, Math.min(0.3, (deltaPct / 100) * 2.5));
  const jitter = Math.max(Math.abs(drift) * 0.35, 0.002);
  const out: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    const base = end * (1 - drift * (1 - t));
    const v = base * (1 + (rnd() - 0.5) * 2 * jitter);
    out.push(clampTo100 ? Math.min(v, 100) : v);
  }
  out[n - 1] = end;
  return out;
}

/** 증감을 상대 변화율(%)로 환산한다 — 건수형은 이미 %, 나머지는 값 대비로 본다 */
export function relativeDelta(m: MetricSpec, p: PeriodKey): number {
  const d = m.d[P_INDEX[p]];
  if (m.kind === "count" || m.kind === "eok" || m.kind === "manwon") return d;
  const v = metricValue(m, p);
  return v ? (d / v) * 100 : 0;
}

/* ---------------------------- 레이어 명세 ---------------------------- */

export interface TargetSpec {
  id: string;
  label: string;
  unit: string;
  v: number;
  flow?: boolean;
  vp?: [number, number, number];
  /** 기준일 잔액이라 기간 필터를 따르지 않는 대상 */
  fixedPeriod?: boolean;
}

export interface AxisSpec {
  id: string;
  label: string;
  items: string[];
  /** 대상 id → 항목별 비율 */
  ratios: Record<string, number[]>;
  /** 항목별 전기 대비 증감 % */
  d: number[];
  /** 증가가 좋은 축인가 (결제 실패 사유처럼 감소가 좋으면 false) */
  up?: boolean;
  ordinal?: boolean;
  /** 등급 축처럼 중간에 역할 경계가 있는 축 — 색을 두 계열로 나눈다 */
  roleSplit?: boolean;
  caveats?: Record<string, string>;
}

export interface ExtraSpec {
  title: string;
  note?: string;
  /** 이 축을 보고 있을 때만 표시 */
  showOnAxis?: string;
  /** 첫 칸은 행 라벨의 머리글 */
  head: string[];
  /** head[1..] 에 대응하는 열 정의. sum 을 안 주면 flow 인 열만 합계를 낸다 */
  cols: { kind: Kind; unit?: string; flow?: boolean; sum?: boolean }[];
  /** null 은 **아직 측정할 수 없는 값**이다. 0 으로 쓰면 "없다" 로 읽히므로 구분한다 */
  rows: [string, ...(number | null)[]][];
  /** 합계 행 — flow 열만 합산하고 나머지는 — 로 둔다 */
  total?: boolean;
  /** 이 열 값이 min 이상이면 경고색 */
  hot?: { col: number; min: number };
  /** {0} {1} … 은 합계 행의 값으로 치환된다. <b> 허용 */
  footnote?: string;
}

/* ------------------------------ 관점(렌즈) ------------------------------ */

/**
 * 구매/판매 관점에서 이 레이어를 어떻게 좁혀 보여줄 것인가.
 *
 * 더미 단계에서는 비율을 곱해 흉내낸다. 실데이터가 붙으면 이 계수는 사라지고
 * 어댑터가 실제로 역할별 집계를 질의한다 — **화면 계약은 그대로다**.
 */
export interface LensSpec {
  scope: LensScope;
  /** 수량형(명·건·원)에 곱할 비율 */
  volume?: Record<Exclude<Lens, "all">, number>;
  /** 비율형에 곱할 비율. 100% 를 넘지 않게 잘린다 */
  rate?: Record<Exclude<Lens, "all">, number>;
}

const VOLUME_KINDS: Kind[] = ["count", "eok", "manwon"];
const RATE_KINDS: Kind[] = ["rate", "rate2"];

/** 이 관점에서 쓸 배수. 해당 없으면 1 */
function lensFactor(kind: Kind, lens: Lens, ls?: LensSpec): number {
  if (lens === "all" || !ls || !lensApplies(ls.scope, lens)) return 1;
  if (VOLUME_KINDS.includes(kind)) return ls.volume?.[lens] ?? 1;
  if (RATE_KINDS.includes(kind)) return ls.rate?.[lens] ?? 1;
  /* 시간·점수형은 역할로 갈라도 크게 다르지 않다 — 건드리지 않는다 */
  return 1;
}

function scaleBy(v: number, f: number, cap: number): number {
  return Math.min(v * f, cap);
}

/** 증감(d)은 비율이라 배수에 영향받지 않는다 — 값만 조정한다 */
export function lensMetric(m: MetricSpec, lens: Lens, ls?: LensSpec): MetricSpec {
  const f = lensFactor(m.kind, lens, ls);
  if (f === 1) return m;
  const cap = RATE_KINDS.includes(m.kind) ? 100 : Number.POSITIVE_INFINITY;
  return {
    ...m,
    v: scaleBy(m.v, f, cap),
    vp: m.vp
      ? [scaleBy(m.vp[0], f, cap), scaleBy(m.vp[1], f, cap), scaleBy(m.vp[2], f, cap)]
      : undefined,
  };
}

function lensTarget(t: TargetSpec, lens: Lens, ls?: LensSpec): TargetSpec {
  const f = lensFactor("count", lens, ls);
  if (f === 1) return t;
  return {
    ...t,
    v: t.v * f,
    vp: t.vp ? [t.vp[0] * f, t.vp[1] * f, t.vp[2] * f] : undefined,
  };
}

export interface LayerSpec {
  id: string;
  idx: string;
  title: string;
  eyebrow: string;
  /** 정의 한 줄 — 무엇을 세는지 */
  define: string;
  main: MetricSpec;
  /** 지표 사전의 id — 목표·임계(settings)와 정의를 이 값으로 찾는다 */
  metricId: string;
  /** 메인 지표를 표시할 단위 — 개요가 목표와 비교할 때 쓴다 */
  mainUnit: string;
  mainDecimals: number;
  footer: { k: string; m?: MetricSpec; fixed?: string; pending?: string }[];
  subs: MetricSpec[];
  targets: TargetSpec[];
  axes: AxisSpec[];
  extras?: ExtraSpec[];
  /** 구매/판매 관점 지원 범위. 생략하면 역할과 무관한 지표로 본다 */
  lens?: LensSpec;
}

/* ------------------------------ 조립 ------------------------------ */

function buildBreakdown(spec: LayerSpec, p: PeriodKey, lens: Lens): Breakdown {
  const targets = spec.targets.map((raw) => {
    const t = lensTarget(raw, lens, spec.lens);
    return {
      id: t.id,
      label: t.label,
      unit: t.unit,
      total: Math.round(t.vp ? t.vp[P_INDEX[p]] : t.flow ? t.v * SCALE[p] : t.v),
      fixedPeriod: t.fixedPeriod,
    };
  });

  const axes: BreakdownAxis[] = spec.axes.map((a) => ({
    id: a.id,
    label: a.label,
    items: a.items,
    ratios: a.ratios,
    deltas: a.d.map((d) => makeDelta(d, "count", a.up ?? true)),
    ordinal: a.ordinal,
    roleSplit: a.roleSplit,
    caveats: a.caveats,
  }));

  return { targets, axes };
}

function buildExtra(spec: ExtraSpec, p: PeriodKey): ExtraTable {
  const scale = SCALE[p];
  const val = (n: number, c: ExtraSpec["cols"][number]) =>
    fmtValue(c.flow ? n * scale : n, c.kind, c.unit);

  const columns = spec.head.map((label, i) => ({
    key: `c${i}`,
    label,
    left: i === 0,
  }));

  const rows = spec.rows.map((r) => {
    const cells: Record<string, string> = { c0: String(r[0]) };
    spec.cols.forEach((c, i) => {
      const raw = r[i + 1] as number | null;
      /* 측정 불가를 0 으로 찍으면 "실적이 없다" 로 읽힌다 */
      cells[`c${i + 1}`] = raw === null ? "—" : val(raw, c);
    });
    const hotCell = spec.hot ? (r[spec.hot.col + 1] as number | null) : null;
    const hot =
      spec.hot && hotCell !== null && hotCell >= spec.hot.min
        ? [`c${spec.hot.col + 1}`]
        : undefined;
    return { cells, hot };
  });

  /* 합계를 내도 되는 열인지 — 비율·소요시간은 더하면 안 된다 */
  const summable = spec.cols.map((c) => c.sum ?? c.flow ?? false);
  /* 측정 불가(null)는 합계에서 뺀다 — 0 으로 더하면 합계가 작아진 것처럼 보인다 */
  const sums = spec.cols.map((c, i) =>
    summable[i]
      ? spec.rows.reduce((a, r) => a + ((r[i + 1] as number | null) ?? 0), 0)
      : NaN,
  );

  let total: Record<string, string> | undefined;
  if (spec.total) {
    total = { c0: "합계" };
    spec.cols.forEach((c, i) => {
      total![`c${i + 1}`] = summable[i] ? val(sums[i], c) : "—";
    });
  }

  const footnote = spec.footnote?.replace(/\{(\d+)\}/g, (_, n: string) => {
    const i = Number(n);
    const c = spec.cols[i];
    if (!c || !summable[i]) return "";
    return fmtValue(c.flow ? sums[i] * scale : sums[i], c.kind, "");
  });

  return {
    title: spec.title,
    note: spec.note,
    columns,
    rows,
    total,
    footnote,
    showOnAxis: spec.showOnAxis,
  };
}

export function buildLayer(
  spec: LayerSpec,
  p: PeriodKey,
  asOf: string,
  lens: Lens = "all",
): LayerData {
  const scope: LensScope = spec.lens?.scope ?? "none";
  /* 관점이 이 레이어에 해당하지 않으면 값을 건드리지 않고, 왜 그런지 화면에 알린다 */
  const applies = lensApplies(scope, lens);
  const lensNote =
    lens === "all" || applies || scope === "both"
      ? undefined
      : LENS_SCOPE_NOTE[scope as Exclude<LensScope, "both">];

  const mainSpec = lensMetric(spec.main, lens, spec.lens);
  const main = renderMetric(mainSpec, p);
  const subs: SubTile[] = spec.subs.map((raw) => {
    const m = lensMetric(raw, lens, spec.lens);
    const r = renderMetric(m, p);
    return { name: m.name, value: r.value, delta: r.delta };
  });

  const gran = GRAN[p];
  const k = spec.main.kind;
  /* 추이 축 라벨도 메인 지표와 같은 단위로 읽혀야 한다 */
  const trendUnit =
    k === "count"
      ? (spec.main.unit ?? "명")
      : k === "rate" || k === "rate2"
        ? "%"
        : k === "min"
          ? "분"
          : k === "eok"
            ? "억"
            : k === "manwon"
              ? "만원"
              : "";
  const trendDec = k === "count" || k === "manwon" || k === "min" ? 0 : k === "rate2" ? 2 : 1;

  const capped = k === "rate" || k === "rate2";
  const series = makeSeries(metricValue(mainSpec, p), relativeDelta(mainSpec, p), spec.id + p + lens, 12, capped);

  /* 차트 종류는 **지표**의 성질이지 기간의 성질이 아니다.
     기간을 바꿀 때마다 막대가 선으로 바뀌면 같은 지표로 안 읽힌다.
     그래서 판정은 항상 최근 7일 기준 한 번만 한다. */
  const probe = makeSeries(
    metricValue(mainSpec, "d7"),
    relativeDelta(mainSpec, "d7"),
    `${spec.id}d7${lens}`,
    12,
    capped,
  );
  const lo = Math.min(...probe);
  const hi = Math.max(...probe);
  /* 변동폭이 값의 8% 미만이면 막대로는 차이가 안 보인다 */
  const kind: "bar" | "line" = hi > 0 && (hi - lo) / hi < 0.08 ? "line" : "bar";

  return {
    idx: spec.idx,
    title: spec.title,
    period: PERIODS[p],
    asOf,
    main: {
      eyebrow: spec.eyebrow,
      name: spec.define,
      value: main.value,
      delta: main.delta,
      footer: spec.footer.map((f) => ({
        k: f.k,
        v: f.fixed ?? (f.m ? renderMetric(lensMetric(f.m, lens, spec.lens), p).value : "—"),
        pending: f.pending,
      })),
    },
    trend: {
      granularity: gran.label,
      labels: gran.labels,
      series,
      unit: trendUnit,
      decimals: trendDec,
      kind,
    },
    subs,
    lensScope: scope,
    lensNote,
    breakdown: buildBreakdown(spec, p, lens),
    extras: spec.extras?.map((e) => buildExtra(e, p)),
  };
}
