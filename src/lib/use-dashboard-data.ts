"use client";

import { useEffect, useState } from "react";
import type { PeriodKey } from "@/lib/data/types";

/**
 * 기간별로 한 번만 받아 두고 재사용한다.
 * 기간 칩을 왔다갔다 할 때 매번 로딩이 뜨면 대시보드로서 못 쓸 물건이 된다.
 */
const cache = new Map<string, unknown>();

export interface Loadable<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useDashboardData<T>(endpoint: string, period: PeriodKey): Loadable<T> {
  const key = `${endpoint}:${period}`;
  const cached = cache.get(key) as T | undefined;

  const [data, setData] = useState<T | null>(cached ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(cached === undefined);

  useEffect(() => {
    const hit = cache.get(key) as T | undefined;
    if (hit !== undefined) {
      setData(hit);
      setError(null);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);

    fetch(`/api/${endpoint}?period=${period}`)
      .then(async (res) => {
        /* 세션이 만료되면 조용히 실패하지 말고 로그인 화면으로 보낸다 */
        if (res.status === 401) {
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
          throw new Error("로그인이 필요합니다.");
        }
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return (await res.json()) as T;
      })
      .then((json) => {
        cache.set(key, json);
        if (!alive) return;
        setData(json);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.");
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [key, endpoint, period]);

  return { data, error, loading };
}
