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
import { DEFAULT_GOALS, type MetricGoal } from "@/lib/settings";

interface Override {
  value?: number | null;
  critValue?: number;
}

interface SettingsState {
  goals: MetricGoal[];
  goalFor: (metricId: string) => MetricGoal | undefined;
  setGoal: (metricId: string, patch: Override) => void;
  resetGoal: (metricId: string) => void;
  resetAll: () => void;
  /** 기본값에서 바뀐 지표 수 — 화면에 "저장되지 않음"을 알리는 데 쓴다 */
  changedCount: number;
}

const Ctx = createContext<SettingsState | null>(null);

const STORE_KEY = "pharme.dashboard.goals";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, Override>>({});

  /**
   * 지금은 이 브라우저에만 저장된다.
   * 팀 전체가 같은 목표를 보려면 DB 에 올려야 하고, 그때 이 훅만 바뀐다.
   */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) setOverrides(JSON.parse(raw) as Record<string, Override>);
    } catch {
      /* 못 읽어도 기본값으로 동작해야 한다 */
    }
  }, []);

  const persist = useCallback((next: Record<string, Override>) => {
    setOverrides(next);
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* 시크릿 모드 등 — 무시 */
    }
  }, []);

  const goals = useMemo(
    () =>
      DEFAULT_GOALS.map((g) => {
        const o = overrides[g.metricId];
        return o ? { ...g, ...o } : g;
      }),
    [overrides],
  );

  const value = useMemo<SettingsState>(
    () => ({
      goals,
      goalFor: (metricId) => goals.find((g) => g.metricId === metricId),
      setGoal: (metricId, patch) =>
        persist({ ...overrides, [metricId]: { ...overrides[metricId], ...patch } }),
      resetGoal: (metricId) => {
        const next = { ...overrides };
        delete next[metricId];
        persist(next);
      },
      resetAll: () => persist({}),
      changedCount: Object.keys(overrides).length,
    }),
    [goals, overrides, persist],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSettings 는 SettingsProvider 안에서만 쓸 수 있습니다.");
  return v;
}
