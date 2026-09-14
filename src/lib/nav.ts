/** 좌측 레일 구성. 지표 사전의 8레이어 구조를 그대로 따른다. */
export interface NavItem {
  idx: string;
  title: string;
  href: string;
  /** 임계값 이탈 표시 — 실데이터가 붙으면 alerts 에서 계산해 채운다 */
  dot?: "warn" | "crit";
}

export const NAV_MAIN: NavItem[] = [{ idx: "—", title: "개요", href: "/" }];

export const NAV_LAYERS: NavItem[] = [
  { idx: "01", title: "획득", href: "/layer/acq" },
  { idx: "02", title: "활성", href: "/layer/active" },
  { idx: "03", title: "전환", href: "/layer/convert", dot: "warn" },
  { idx: "04", title: "유지", href: "/layer/retain" },
  { idx: "05", title: "공급", href: "/layer/supply", dot: "warn" },
  { idx: "06", title: "신뢰·품질", href: "/layer/trust", dot: "crit" },
  { idx: "07", title: "재무", href: "/layer/finance" },
  { idx: "08", title: "시스템", href: "/layer/system" },
];

export const NAV_REF: NavItem[] = [
  { idx: "▸", title: "지표 사전", href: "/ref/dictionary" },
  { idx: "▸", title: "설정", href: "/ref/settings" },
];

const ALL = [...NAV_MAIN, ...NAV_LAYERS, ...NAV_REF];

export function titleFor(pathname: string): string {
  return ALL.find((n) => n.href === pathname)?.title ?? "개요";
}
