/**
 * 결제 퍼널 원본 데이터.
 *
 * 개요(L0)의 "결제 퍼널" 카드와 03 전환 레이어의 퍼널 섹션이 같은 숫자를 써야 한다 —
 * 따로 관리하면 개요에서는 이탈이 1위인 구간이 레이어 탭에서는 다르게 보이는 식으로
 * 어긋난다. 그래서 두 화면 모두 이 파일 하나를 참조한다.
 */
import type { PeriodKey } from "../../types";

export const FUNNEL_STAGES = [
  { name: "상품 상세 조회", event: "view_item" },
  { name: "장바구니 담기", event: "add_to_cart", avgTime: "1분 52초" },
  { name: "결제 시작", event: "begin_checkout", avgTime: "41초" },
  { name: "결제 완료", event: "purchase", avgTime: "36초" },
] as const;

export const FUNNEL_VALUES: Record<PeriodKey, number[]> = {
  d1: [6880, 2064, 1176, 929],
  d7: [48200, 14460, 8240, 6510],
  d28: [192400, 55800, 32360, 25890],
};

/**
 * 03 전환 레이어 "구매 전환율"(방문 대비 결제완료, 순 방문자 기준)과 이 퍼널의
 * 종단 전환율(세션 기준 · 6,510/48,200 ≒ 13.5%)이 다른 이유. 숫자가 안 맞는 게
 * 아니라 분모가 다르다 — 지우지 말고 같이 보여줘야 한다.
 */
export const FUNNEL_CAVEAT =
  "이 퍼널은 <b>세션 단위</b>입니다. 메인 지표 \"구매 전환율\"은 <b>순 방문자 단위</b>라 " +
  "분모가 달라 두 수치는 직접 비교되지 않습니다 — 같은 방문자가 다시 들어오면 세션이 " +
  "늘어나 종단 전환율은 그만큼 낮게 보입니다.";
