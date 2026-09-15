"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CompareMode, PeriodKey } from "@/lib/data/types";
import { isLens, type Lens, type LensScope } from "@/lib/segments";

/**
 * 기간·비교기준은 대시보드 전역 상태다.
 * 탭을 옮겨도 유지돼야 하므로 루트 레이아웃에 한 번만 얹는다.
 */
interface DashboardState {
  period: PeriodKey;
  setPeriod: (p: PeriodKey) => void;
  compare: CompareMode;
  setCompare: (c: CompareMode) => void;
  /** 구매/판매 관점. 세그먼트가 아니라 렌즈다 — 둘을 더해도 전체가 아니다 */
  lens: Lens;
  setLens: (l: Lens) => void;
  /**
   * 지금 보고 있는 화면이 지원하는 관점 범위.
   * 화면이 알려 주고 상단 필터가 읽는다 — 이 값이 없으면 필터는 고를 수 없는
   * 관점을 열어 두고, 고르는 순간 되돌려 놓는 이상한 동작을 하게 된다.
   */
  lensScope: LensScope;
  setLensScope: (s: LensScope) => void;
  /** 전역 필터에 맞춘 비교 라벨을 만들어 준다 */
  cmpLabel: (meta: { cmp: string; cmpYoy: string }) => string;
}

const Ctx = createContext<DashboardState | null>(null);

const STORE_KEY = "pharme.dashboard.filter";

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<PeriodKey>("d7");
  const [compare, setCompare] = useState<CompareMode>("prev");
  const [lens, setLens] = useState<Lens>("all");
  /* 관점 범위는 화면을 옮길 때마다 새로 정해지므로 저장하지 않는다 */
  const [lensScope, setLensScope] = useState<LensScope>("both");

  /* 새로고침해도 보던 기간이 유지되도록 — 브라우저 한정, 서버로 나가지 않는다 */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<{
        period: PeriodKey;
        compare: CompareMode;
        lens: string;
      }>;
      if (saved.period) setPeriod(saved.period);
      if (saved.compare) setCompare(saved.compare);
      if (saved.lens && isLens(saved.lens)) setLens(saved.lens);
    } catch {
      /* 저장소를 못 읽어도 기본값으로 동작해야 한다 */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify({ period, compare, lens }));
    } catch {
      /* 시크릿 모드 등 — 무시 */
    }
  }, [period, compare, lens]);

  const cmpLabel = useCallback(
    (meta: { cmp: string; cmpYoy: string }) => (compare === "yoy" ? meta.cmpYoy : meta.cmp),
    [compare],
  );

  const value = useMemo<DashboardState>(
    () => ({ period, setPeriod, compare, setCompare, lens, setLens, lensScope, setLensScope, cmpLabel }),
    [period, compare, lens, lensScope, cmpLabel],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard(): DashboardState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDashboard 는 DashboardProvider 안에서만 쓸 수 있습니다.");
  return v;
}
