"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useDashboard } from "@/lib/dashboard-context";
import { captureElement } from "@/lib/capture";
import { NAV_LAYERS, NAV_MAIN, NAV_REF, titleFor, type NavItem } from "@/lib/nav";
import type { PeriodKey } from "@/lib/data/types";
import { LENSES, LENS_HINT, LENS_LABEL, LENS_SCOPE_NOTE, lensApplies } from "@/lib/segments";

const PERIOD_TABS: { key: PeriodKey; label: string }[] = [
  { key: "d1", label: "어제" },
  { key: "d7", label: "최근 7일" },
  { key: "d28", label: "최근 28일" },
];

function RailLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className="rail-item"
      aria-current={active ? "page" : undefined}
    >
      <span className="idx">{item.idx}</span>
      {item.title}
      {item.dot && <i className={`dot dot-${item.dot}`} title="임계값 이탈" />}
    </Link>
  );
}

interface ShellProps {
  children: ReactNode;
  /** 로그인한 사람. 로그인을 건너뛴 개발 환경에서는 null */
  user: { name: string; email: string } | null;
  /** 서버 액션이 들어 있는 폼 — 클라이언트에서 만들 수 없어 넘겨받는다 */
  signOut: ReactNode;
}

export default function Shell({ children, user, signOut }: ShellProps) {
  const pathname = usePathname();
  const { period, setPeriod, compare, setCompare, lens, setLens, lensScope } = useDashboard();
  const [saving, setSaving] = useState(false);
  const title = titleFor(pathname);
  /* 참조 화면(지표 사전·설정)은 기간과 무관하다 — 쓸 수 없는 필터를 띄워두지 않는다 */
  const hasPeriod = !pathname.startsWith("/ref");

  async function saveScreen() {
    const canvas = document.querySelector<HTMLElement>(".canvas");
    if (!canvas) return;
    setSaving(true);
    try {
      await captureElement(canvas, title);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="notice">
        <span className="tag">더미</span>
        <span>
          실데이터 연동 전입니다. 화면의 모든 수치는 <b>예시 데이터</b>이며 실제 플랫폼
          데이터가 아닙니다.
        </span>
      </div>

      {/* 관점이 바뀌면 작업 영역 바탕색이 바뀐다 — 필터 드롭다운을 보지 않아도
          지금 어느 쪽 눈으로 보고 있는지 알 수 있어야 한다 */}
      <div className="app" data-lens={hasPeriod ? lens : "all"}>
        <aside className="rail">
          <div className="brand">
            <span className="mark" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 14 14">
                <path
                  d="M2.5 11.5V2.5h3.9a3 3 0 0 1 0 6H4.6"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10.5" cy="11" r="1.6" fill="#fff" />
              </svg>
            </span>
            <span>
              <span className="nm">파메 플랫폼</span>
              <span className="sub">운영 대시보드</span>
            </span>
          </div>

          <nav className="rail-nav" aria-label="주요">
            {NAV_MAIN.map((n) => (
              <RailLink key={n.href} item={n} active={pathname === n.href} />
            ))}
          </nav>

          <div className="rail-lbl">레이어</div>
          <nav className="rail-nav" aria-label="레이어">
            {NAV_LAYERS.map((n) => (
              <RailLink key={n.href} item={n} active={pathname === n.href} />
            ))}
          </nav>

          <div className="rail-lbl">참조</div>
          <nav className="rail-nav" aria-label="참조">
            {NAV_REF.map((n) => (
              <RailLink key={n.href} item={n} active={pathname === n.href} />
            ))}
          </nav>

          <div className="rail-foot">
            {user ? (
              <>
                <span className="avatar">{user.name.slice(0, 1)}</span>
                <span className="who">
                  <b>{user.name}</b>
                  <span title={user.email}>{user.email}</span>
                </span>
                {signOut}
              </>
            ) : (
              <span className="who">
                <b>로그인 없음</b>
                <span>개발 환경 — 아무나 접근 가능</span>
              </span>
            )}
          </div>
        </aside>

        <main>
          <div className="topbar">
            <div className="page-id">
              <h1>{title}</h1>
              {hasPeriod && <span className="stamp">집계 기준 2026-09-13 06:00</span>}
            </div>

            <div className="tools">
              {hasPeriod && (
                <>
                  <div className="seg" role="group" aria-label="기간 선택">
                    {PERIOD_TABS.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        aria-pressed={period === t.key}
                        onClick={() => setPeriod(t.key)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <select
                    className="sel"
                    aria-label="비교 기준"
                    value={compare}
                    onChange={(e) => setCompare(e.target.value as "prev" | "yoy")}
                  >
                    <option value="prev">직전 기간 대비</option>
                    <option value="yoy">전년 동기 대비</option>
                  </select>

                  <select className="sel" aria-label="플랫폼" defaultValue="all">
                    <option value="all">전체 플랫폼</option>
                    <option value="ios">iOS</option>
                    <option value="android">Android</option>
                    <option value="web">Web</option>
                  </select>

                  <select
                    className="sel"
                    aria-label="구매·판매 관점"
                    value={lens}
                    title={
                      lensScope === "both"
                        ? LENS_HINT[lens]
                        : LENS_SCOPE_NOTE[lensScope]
                    }
                    onChange={(e) => setLens(e.target.value as typeof lens)}
                  >
                    {LENSES.map((l) => {
                      /* 이 화면에서 성립하지 않는 관점은 아예 고를 수 없게 한다.
                         고를 수 있게 두고 되돌리면 필터가 고장난 것처럼 보인다 */
                      const ok = lensApplies(lensScope, l);
                      return (
                        <option key={l} value={l} disabled={!ok}>
                          {LENS_LABEL[l]}
                          {ok ? "" : " (해당 없음)"}
                        </option>
                      );
                    })}
                  </select>
                </>
              )}

              <button className="btn-dl" type="button" onClick={saveScreen} disabled={saving}>
                {saving ? "저장 중…" : "이미지 저장"}
              </button>
            </div>
          </div>

          {children}
        </main>
      </div>
    </>
  );
}
