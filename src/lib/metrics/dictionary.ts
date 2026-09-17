/**
 * 지표 사전 — 8개 레이어 · 76개 지표.
 *
 * **id 가 이 파일의 존재 이유다.** 화면의 카드와 정의를 연결하려면 지표마다
 * 변하지 않는 이름표가 있어야 하고, 나중에 붙이면 다음 번호로 소급해서 달아야 한다.
 * id 는 한 번 부여하면 바꾸지 않는다 — 지표가 추가되면 그 레이어의 다음 번호를 쓴다.
 *
 * 원본: 지표 사전 v1 아티팩트 (2026-09-14 시점)
 */

/** 지금 이 지표를 실제로 뽑을 수 있는가 */
export type MetricStatus =
  | "ga4" // GA4 에 이벤트가 이미 있어 바로 조회 가능
  | "db" // DB 쿼리·집계 필요
  | "api" // 외부 서비스 연동 필요 (Crashlytics, 채널톡, PG)
  | "none"; // 현재 수집 자체가 안 됨 — 개발 조치 필요

export const STATUS_LABEL: Record<MetricStatus, string> = {
  ga4: "GA4 즉시",
  db: "DB 연동",
  api: "외부 API",
  none: "측정 불가",
};

/**
 * 어느 쪽으로 움직이는 게 좋은 지표인가.
 * 증감 색이 이걸 따른다 — CS 첫응답 시간은 ▼가 초록이어야 한다.
 *
 * `mixed` 는 한 행에 방향이 반대인 지표가 같이 들어 있다는 뜻이다.
 * 사전을 쪼개기 전에는 그 지표의 카드 색을 자동으로 정할 수 없다.
 */
export type MetricDirection = "higher" | "lower" | "mixed";

export const DIRECTION_LABEL: Record<MetricDirection, string> = {
  higher: "높을수록 좋음",
  lower: "낮을수록 좋음",
  mixed: "분리 필요",
};

export interface MetricDef {
  /** 변하지 않는 이름표 — 화면 카드가 이 값으로 정의를 찾아온다 */
  id: string;
  name: string;
  /** 쪼개서 볼 수 있는 단위 */
  segment: string;
  definition: string;
  /** 계산식 — 같은 이름의 지표가 팀마다 다르게 계산되는 걸 막는다 */
  calc: string;
  source: string;
  status: MetricStatus;
  /** ※ 현재 값은 지표명 기준 자동 판정 + 수동 보정한 초안이다. 기획팀 검토 필요. */
  direction: MetricDirection;
}

export interface MetricLayer {
  /** 레일의 슬러그와 같다 — /layer/<slug> */
  slug: string;
  idx: string;
  name: string;
  en: string;
  /** 이 레이어가 답하려는 질문 */
  question: string;
  metrics: MetricDef[];
}

export const METRIC_LAYERS: MetricLayer[] = [
  {
    slug: "acq",
    idx: "01",
    name: "획득",
    en: "ACQUISITION",
    question: "유저가 어디서 들어오고, 얼마나 가입까지 도달하는가",
    metrics: [
      {
        id: "acq-01",
        name: "신규 가입자 수",
        segment: "일 / 주 / 월",
        definition: "가입을 완료한 유저 수",
        calc: "COUNT(sign_up)",
        source: "GA4 sign_up · DB users.created_at",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "acq-02",
        name: "가입 전환율",
        segment: "국내 / 해외",
        definition: "가입 퍼널 진입자 중 완료 비율. 이탈 지점 진단의 출발점",
        calc: "sign_up ÷ (sign_up_start + sign_up_start_overseas)",
        source: "GA4 sign_up_start, sign_up_start_overseas, sign_up",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "acq-03",
        name: "해외 가입 비중",
        segment: "국가별",
        definition: "해외 유입 규모. 다국어 대응 우선순위 판단",
        calc: "sign_up_start_overseas ÷ 전체 가입 시작",
        source: "GA4 sign_up_start_overseas + geo",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "acq-04",
        name: "SNS 간편가입 비중",
        segment: "채널별(카카오/애플 등)",
        definition: "가입 방식 선호도. 간편가입 채널 추가 판단 근거",
        calc: "social_sign_up_click ÷ sign_up_start",
        source: "GA4 social_sign_up_click",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "acq-05",
        name: "신규 방문자 (UV)",
        segment: "iOS / AOS / Web",
        definition: "처음 방문한 순 유저 수",
        calc: "COUNT(first_visit)",
        source: "GA4 first_visit (자동)",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "acq-06",
        name: "유입 채널별 신규 유저",
        segment: "source / medium / campaign",
        definition: "어떤 채널이 실제 가입까지 데려오는가",
        calc: "first_visit, sign_up × session_source",
        source: "GA4 기본 수집 (UTM 규칙 정의 필요)",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "acq-07",
        name: "초대가입 전환율",
        segment: "마이페이지 / 미니샵",
        definition:
          "초대 코드 복사가 실제 가입으로 이어지는 비율. 복사 건수 단독으론 바이럴 " +
          "효과를 못 읽는다는 기획 피드백(2026-09-17)으로 전환율로 바꿨다 — " +
          "분자(초대 코드로 가입 완료)를 집계하려면 가입 시 사용한 초대 코드가 저장돼야 함",
        calc: "sign_up WHERE referral_code IS NOT NULL ÷ (mypage_referral_code_copy + minishop_referral_code_copy)",
        source: "GA4 mypage_referral_code_copy, minishop_referral_code_copy + DB users.referral_code",
        status: "db",
        direction: "higher",
      },
      {
        id: "acq-09",
        name: "추천인 탐색 이용률",
        segment: "-",
        definition: "추천인 미등록 회원이 탐색 기능을 쓰는 비율",
        calc: "referral_search_click ÷ referral_intro_view",
        source: "GA4 referral_intro_view, referral_search_click",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "acq-10",
        name: "판매자 전환 신청 수",
        segment: "신청 / 승인",
        definition: "구매자 → 판매자 전환. 공급 측 유입의 핵심 경로",
        calc: "COUNT(mypage_seller_apply) / 승인 건수는 DB",
        source: "GA4 mypage_seller_apply · DB seller_applications",
        status: "db",
        direction: "higher",
      },
    ],
  },
  {
    slug: "active",
    idx: "02",
    name: "활성",
    en: "ENGAGEMENT",
    question: "들어온 유저가 플랫폼 안에서 실제로 무언가를 하는가",
    metrics: [
      {
        id: "active-01",
        name: "기능 활성률",
        segment: "구매자 / 판매자 · 플랫폼별",
        definition:
          "활성 유저 중 핵심 기능(채팅 개설·구매·피드 작성·후기 작성 등)을 1개 이상 쓴 비율 — L3 기준",
        calc: "핵심 기능 이벤트 발생 유저 수 ÷ GA4 활성 유저 수",
        source:
          "GA4 자동 활성 유저(기기 단위) + 핵심 기능 이벤트 — 로그인 기준으로 기기 간 중복을 " +
          "제거하려면 user_id 필요(긴급 01), 그 전까지는 기기 단위 근사치",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "active-04",
        name: "PV / UV",
        segment: "페이지별 · 플랫폼별",
        definition: "기본 트래픽 규모",
        calc: "COUNT(page_view) / COUNT(DISTINCT 세션)",
        source: "GA4 page_view, session_start (자동)",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "active-05",
        name: "세션당 체류시간",
        segment: "iOS / AOS / Web",
        definition: "몰입도. 로그아웃까지의 세션 길이",
        calc: "GA4 engagement_time_msec 평균",
        source: "GA4 자동 + login / logout",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "active-06",
        name: "주요 동선 분포",
        segment: "GNB / BNB 항목별",
        definition: "유저가 실제로 어디로 가는가. IA 개선 근거",
        calc: "navigation_click, BNB_click 항목별 비중",
        source: "GA4 navigation_click, BNB_click, pharmer_gnb_*, seller_gnb_*",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "active-07",
        name: "피드 신규 등록 수",
        segment: "일 / 주",
        definition: "UGC 생산량. 커뮤니티 생존의 선행지표",
        calc: "COUNT(feeds) WHERE created_at ∈ 기간",
        source: "DB feeds.created_at — GA4에는 피드 조회 이벤트만 있고 등록 이벤트가 없음",
        status: "db",
        direction: "higher",
      },
      {
        id: "active-08",
        name: "피드 반응률",
        segment: "좋아요/최고예요/찜/공유",
        definition:
          "콘텐츠가 실제로 소비되는가. 스크롤 중 노출(임프레션) 이벤트가 없어 조회수를 분모로 쓴다",
        calc: "(feed_like + feed_best + feed_bookmark + feed_share) ÷ 피드 조회수",
        source:
          "GA4 feed_like_click, feed_best_click, feed_bookmark_click, feed_share_click ÷ " +
          "피드 조회 이벤트(정확한 이벤트명 확인 필요) — 노출 이벤트는 없음",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "active-09",
        name: "피드 탭별 이용 비중",
        segment: "all / referral",
        definition: "추천인 피드가 실제로 쓰이는가",
        calc: "feed_tab_click 파라미터 tab_type 비중",
        source: "GA4 feed_tab_click (tab_type)",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "active-10",
        name: "채팅방 개설 수",
        segment: "구매자 발신 / 판매자 발신",
        definition: "채팅 진입량",
        calc: "COUNT(chat_open)",
        source: "GA4 chat_open",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "active-12",
        name: "채팅 → 거래 전환",
        segment: "상품 / 미니샵 / 피드",
        definition: "채팅이 거래로 이어지는 비율. 양면 플랫폼의 핵심 연결고리",
        calc: "chat_product_click ÷ chat_open, 이후 purchase 도달률",
        source: "GA4 chat_product_click, chat_profile_minishop_click, chat_profile_feed_click",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "active-13",
        name: "파메라운지 방문 · 멘토 콘텐츠 소비",
        segment: "-",
        definition: "멘토링 커뮤니티 접근성과 콘텐츠 관심도",
        calc: "lounge_visit, mentor_story_view, recommend_mentor_view",
        source: "GA4 lounge_visit, menti_view, mentor_story_view, recommend_mentor_view",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "active-14",
        name: "교육 신청 전환율",
        segment: "교육 콘텐츠별",
        definition: "교육 목록 조회 대비 신청 완료",
        calc: "education_complete ÷ education_list_view",
        source: "GA4 education_list_view, education_view_item, education_complete",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "active-15",
        name: "교육 실참석률",
        segment: "교육별",
        definition: "신청만 하고 안 오는 비율. 노쇼 관리 지표",
        calc: "education_attend ÷ education_complete",
        source: "GA4 education_attend, education_complete",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "active-16",
        name: "검색 이용률",
        segment: "-",
        definition: "세션 중 검색을 쓰는 비율. 탐색 방식 이해",
        calc: "search_result_view 발생 세션 ÷ 전체 세션",
        source: "GA4 search_result_view, autocomplete_click, search_recent_click",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "active-17",
        name: "검색 결과 없음 비율",
        segment: "검색어별",
        definition: "상품 수급 공백이 가장 먼저 드러나는 지표. 검색어 Top 리스트와 세트",
        calc: "search_no_result ÷ (search_result_view + search_no_result)",
        source: "GA4 search_no_result (검색어 파라미터 확인 필요)",
        status: "ga4",
        direction: "lower",
      },
      {
        id: "active-19",
        name: "언어 변경 이용률",
        segment: "언어별",
        definition: "다국어 실수요. 해외 확장 판단 근거",
        calc: "language_change ÷ 전체 세션",
        source: "GA4 pharmer_home_language_change, seller_home_language_change",
        status: "ga4",
        direction: "higher",
      },
    ],
  },
  {
    slug: "convert",
    idx: "03",
    name: "전환",
    en: "CONVERSION",
    question: "방문이 주문으로 이어지는가, 어디서 새는가",
    metrics: [
      {
        id: "convert-01",
        name: "총 주문 수",
        segment: "채널별(일반/미니샵/프로모션/추천)",
        definition: "전체 주문 건수. GA4는 purchase가 4갈래라 중복 위험 — DB를 정답으로",
        calc: "COUNT(orders) WHERE status = 결제완료",
        source: "DB orders (정답) · GA4는 경로 분석용",
        status: "db",
        direction: "higher",
      },
      {
        id: "convert-02",
        name: "방문 대비 구매 전환율",
        segment: "플랫폼 / 유입채널별",
        definition: "퍼널 최상위 효율",
        calc: "purchase 발생 세션 ÷ 전체 세션",
        source: "GA4 purchase, session_start",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "convert-03",
        name: "상품상세 → 장바구니",
        segment: "카테고리별",
        definition: "상품 매력도. 낮으면 상세페이지·가격 문제",
        calc: "add_to_cart ÷ view_item",
        source: "GA4 view_item, add_to_cart",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "convert-04",
        name: "장바구니 → 결제 시작",
        segment: "-",
        definition: "장바구니 이탈 구간",
        calc: "begin_checkout ÷ view_cart",
        source: "GA4 view_cart, begin_checkout",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "convert-05",
        name: "결제 시작 → 완료",
        segment: "결제수단별",
        definition: "결제 단계 이탈. 가장 아까운 이탈 구간",
        calc: "purchase ÷ begin_checkout · 중간 checkout_start 확인",
        source: "GA4 begin_checkout, checkout_start, purchase",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "convert-06",
        name: "결제 실패율",
        segment: "결제수단 / 오류코드별",
        definition: "장애 조기 감지. 급증하면 PG 연동 문제",
        calc: "payment_failed ÷ (purchase + payment_failed)",
        source: "GA4 payment_failed, payment_method_select",
        status: "ga4",
        direction: "lower",
      },
      {
        id: "convert-07",
        name: "쿠폰 · 크레딧 사용률",
        segment: "쿠폰 종류별",
        definition: "프로모션 원가 부담과 크레딧 소진 속도",
        calc: "coupon_apply ÷ purchase, credit_apply ÷ purchase",
        source: "GA4 coupon_download, coupon_apply, credit_apply",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "convert-08",
        name: "즉시구매 비중",
        segment: "-",
        definition: "장바구니를 건너뛰는 구매 성향",
        calc: "buy_now_click ÷ (buy_now_click + add_to_cart)",
        source: "GA4 buy_now_click",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "convert-09",
        name: "추천영역 전환율",
        segment: "추천 알고리즘 버전별",
        definition: "개인화 추천의 실효. 개선 A/B 판단 근거",
        calc: "pharmer_recommendation_item_purchase ÷ pharmer_recommendation_item_click",
        source: "GA4 pharmer_recommendation_item_click, ..._purchase",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "convert-10",
        name: "프로모션 전환율",
        segment: "기획전별 (promotion_id)",
        definition: "기획전 성과. 노출 → 진입 → 구매 3단",
        calc: "promotion_section_click ÷ promotion_section_view → promotion_purchase",
        source: "GA4 promotion_section_view/click, promotion_item_click, promotion_purchase (promotion_id)",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "convert-12",
        name: "프로모션 배너 CTR",
        segment: "-",
        definition: "프로모션 영역 배너는 view/click 쌍이 정상 확보됨",
        calc: "promotion_banner_click ÷ promotion_banner_view",
        source: "GA4 promotion_banner_view, promotion_banner_click",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "convert-13",
        name: "정기배송 · 선물하기 관심도",
        segment: "상품 / 미니샵",
        definition: "부가 구매 형태의 수요. 기능 투자 판단",
        calc: "routin_button ÷ view_item, gift_button ÷ view_item",
        source: "GA4 routin_button, gift_button, minishop_routine_button, minishop_gift_button",
        status: "ga4",
        direction: "higher",
      },
    ],
  },
  {
    slug: "retain",
    idx: "04",
    name: "유지",
    en: "RETENTION",
    question: "데려온 유저가 남아 있는가 — 기존 KPI 목록에서 가장 비어 있던 영역",
    metrics: [
      {
        id: "retain-01",
        name: "D1 / D7 / D30 리텐션",
        segment: "가입 주차 코호트별",
        definition: "가입 후 N일째 돌아온 비율. 플랫폼 생존을 가장 먼저 알려주는 지표",
        calc: "코호트 내 D+N 활성 유저 ÷ 코호트 크기",
        source:
          "GA4 코호트 탐색(기기 단위) — 로그인 기준으로 기기 간 중복을 제거하려면 user_id " +
          "필요(긴급 01), 그 전까지는 기기 단위 근사치",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "retain-02",
        name: "재구매율",
        segment: "1회 / 2회 / 3회+",
        definition: "2회 이상 구매한 유저 비율. 커머스 건강도의 핵심",
        calc: "COUNT(DISTINCT user_id HAVING order_count >= 2) ÷ 전체 구매자",
        source: "DB orders GROUP BY user_id",
        status: "db",
        direction: "higher",
      },
      {
        id: "retain-03",
        name: "평균 재구매 주기",
        segment: "카테고리별",
        definition: "리마인드 푸시·정기배송 제안 타이밍 설계 근거",
        calc: "AVG(다음 주문일 − 직전 주문일)",
        source: "DB orders",
        status: "db",
        direction: "lower",
      },
      {
        id: "retain-04",
        name: "탈퇴자 수 · 탈퇴율",
        segment: "가입 후 경과일별",
        definition: "GA4 이벤트가 없어 DB 전용. 탈퇴 사유 수집 여부도 확인 필요",
        calc: "COUNT(users WHERE withdrawn_at IN 기간) ÷ 기초 회원 수",
        source: "DB users.withdrawn_at — GA4 이벤트 없음",
        status: "db",
        direction: "lower",
      },
      {
        id: "retain-05",
        name: "순 회원 증감",
        segment: "일 / 주 / 월",
        definition: "가입만 보면 안 보이는 실제 성장",
        calc: "신규 가입 − 탈퇴",
        source: "DB users",
        status: "db",
        direction: "higher",
      },
      {
        id: "retain-06",
        name: "등급별 회원 수 · 등급 이동",
        segment: "등급별 · 상향/하향",
        definition: "등급제가 실제로 작동하는가. 상향 유저의 구매 변화까지 함께",
        calc: "등급별 COUNT + 기간 내 등급 변경 이력",
        source: "DB users.grade, grade_history",
        status: "db",
        direction: "higher",
      },
      {
        id: "retain-07",
        name: "찜 · 관심 등록량",
        segment: "상품 / 피드",
        definition: "재방문 의향의 선행지표",
        calc: "add_to_wishlist, view_item_like, feed_bookmark_click",
        source: "GA4 add_to_wishlist, view_item_like, minishop_view_item_like",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "retain-08",
        name: "정기배송 관리 진입",
        segment: "-",
        definition: "구독 유지·해지 관리 행동. 해지 선행 신호로 활용 가능",
        calc: "COUNT(mypage_subscription_manage_view)",
        source: "GA4 mypage_subscription_manage_view",
        status: "ga4",
        direction: "higher",
      },
    ],
  },
  {
    slug: "supply",
    idx: "05",
    name: "공급 건전성",
    en: "SUPPLY",
    question: "판매자 쪽이 살아 있는가 — 양면 플랫폼에서 수요만큼 중요한 절반",
    metrics: [
      {
        id: "supply-01",
        name: "미니샵 개수",
        segment: "개설 / 상품등록 완료",
        definition: "공급 기반의 절대 규모",
        calc: "COUNT(minishops)",
        source: "DB minishops",
        status: "db",
        direction: "higher",
      },
      {
        id: "supply-02",
        name: "미니샵 활성률",
        segment: "주문 기준 / 방문 기준",
        definition: "개설만 하고 방치된 미니샵 비율. 공급 품질의 핵심",
        calc: "기간 내 주문 1건 이상 미니샵 ÷ 전체 미니샵",
        source: "DB minishops + orders",
        status: "db",
        direction: "higher",
      },
      {
        id: "supply-03",
        name: "미니샵 유입량",
        segment: "유입 경로별(채팅/피드/공유)",
        definition: "미니샵이 어디서 발견되는가",
        calc: "COUNT(minishop_view) × 유입 경로",
        source: "GA4 minishop_view, chat_profile_minishop_click, minishop_share",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "supply-04",
        name: "미니샵 주문 전환율",
        segment: "미니샵별",
        definition: "미니샵 자체 퍼널 효율. 일반 스토어와 비교",
        calc: "minishop_purchase ÷ minishop_view",
        source: "GA4 minishop_view → minishop_add_to_cart → minishop_begin_checkout → minishop_purchase",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "supply-05",
        name: "활성 판매자 수",
        segment: "주 / 월",
        definition: "판매자센터 접속 또는 주문 발생이 있는 판매자",
        calc: "COUNT(DISTINCT seller_id WHERE 접속 OR 주문)",
        source: "GA4 seller_admin_dashboard_view + DB sellers",
        status: "db",
        direction: "higher",
      },
      {
        id: "supply-06",
        name: "판매자센터 이용 깊이",
        segment: "메뉴별",
        definition: "판매자가 어떤 기능을 실제로 쓰는가. 미사용 기능 판별",
        calc: "seller_admin_* 이벤트별 순 판매자 수",
        source: "GA4 seller_admin_dashboard_view, ..._sales_dashboard_view, ..._seller_order_view 외",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "supply-07",
        name: "정산 신청 전환율",
        segment: "-",
        definition: "정산 신청 진입 대비 완료. 낮으면 정산 UX 문제",
        calc: "seller_admin_settlement_request ÷ seller_admin_settlement_request_view",
        source: "GA4 seller_admin_settlement_request_view, ..._request",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "supply-08",
        name: "판매자 응대 행동",
        segment: "-",
        definition: "신규 채팅문의·미니샵 미답변에 판매자가 반응하는가",
        calc: "seller_home_newchat_click, seller_home_minishop_reply_click",
        source: "GA4 seller_home_newchat_click, seller_home_minishop_reply_click",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "supply-09",
        name: "전체 등록 상품 수",
        segment: "카테고리 / 판매자별",
        definition: "공급 총량. 검색 결과 없음 비율과 함께 봐야 의미",
        calc: "COUNT(products WHERE status = 판매중)",
        source: "DB products",
        status: "db",
        direction: "higher",
      },
      {
        id: "supply-10",
        name: "멘토 매칭 활동량",
        segment: "주차별",
        definition: "멘토-멘티 매칭이 도는가",
        calc: "seller_home_week_menti_click, menti_view, mentor_story_view",
        source: "GA4 seller_home_week_menti_click, seller_home_all_menti_click, seller_home_mento_story",
        status: "ga4",
        direction: "higher",
      },
    ],
  },
  {
    slug: "trust",
    idx: "06",
    name: "신뢰 · 품질",
    en: "TRUST &amp; QUALITY",
    question: "후기와 CS — 거래액에는 안 잡히지만 이탈을 만드는 영역",
    metrics: [
      {
        id: "trust-01",
        name: "신규 후기 수",
        segment: "일 / 주 · 상품별",
        definition: "기간 내 작성된 후기",
        calc: "COUNT(mypage_review_create)",
        source: "GA4 mypage_review_create · DB reviews",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "trust-02",
        name: "누적 후기 수 · 평균 평점",
        segment: "상품 / 판매자별",
        definition: "누적 신뢰 자산. 평점은 DB에서만",
        calc: "COUNT(reviews), AVG(rating)",
        source: "DB reviews",
        status: "db",
        direction: "higher",
      },
      {
        id: "trust-03",
        name: "구매 대비 리뷰 작성률",
        segment: "카테고리별",
        definition: "후기가 쌓이는 속도. 낮으면 리뷰 유도 설계 필요",
        calc: "COUNT(reviews) ÷ COUNT(orders 배송완료)",
        source: "DB reviews + orders",
        status: "db",
        direction: "higher",
      },
      {
        id: "trust-04",
        name: "리뷰 열람률",
        segment: "상품별",
        definition: "구매 결정에서 리뷰가 갖는 영향력",
        calc: "review_tab_click ÷ view_item",
        source: "GA4 review_tab_click, view_item",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "trust-05",
        name: "CS 문의 건수",
        segment: "문의 유형별",
        definition: "채널톡 유입 문의량. 급증은 장애·정책 이슈 신호",
        calc: "채널톡 대화 수 (기간별)",
        source: "채널톡 Open API — 요금제 확인 필요",
        status: "api",
        direction: "lower",
      },
      {
        id: "trust-06",
        name: "평균 응대 속도 · 해결률",
        segment: "상담원별 / 시간대별",
        definition: "첫 응답까지 걸린 시간, 종결까지 걸린 시간",
        calc: "AVG(첫 응답 시각 − 문의 시각)",
        source: "채널톡 Open API",
        status: "api",
        direction: "mixed",
      },
      {
        id: "trust-07",
        name: "1:1 문의 진입 수",
        segment: "-",
        definition: "앱 내 문의 채널 이용량. 채널톡과 분리 집계",
        calc: "COUNT(mypage_inquiry_view)",
        source: "GA4 mypage_inquiry_view — 제출 완료 이벤트는 없음",
        status: "ga4",
        direction: "lower",
      },
      {
        id: "trust-08",
        name: "취소 · 교환 · 반품률",
        segment: "사유별 / 판매자별",
        definition: "거래액만 보면 놓치는 실질 매출 훼손",
        calc: "COUNT(claims) ÷ COUNT(orders)",
        source: "GA4 mypage_claim_history_view (조회만) · DB claims",
        status: "db",
        direction: "lower",
      },
      {
        id: "trust-09",
        name: "상품 공유 · 확산량",
        segment: "상품 / 미니샵 / 피드",
        definition: "유저가 자발적으로 퍼뜨리는 정도",
        calc: "view_item_share + minishop_share + feed_share_click",
        source: "GA4 view_item_share, minishop_share, minishop_view_item_share, feed_share_click",
        status: "ga4",
        direction: "higher",
      },
    ],
  },
  {
    slug: "finance",
    idx: "07",
    name: "재무",
    en: "FINANCE",
    question: "DB가 유일한 정답 — GA4 수치와 다르면 항상 DB 기준",
    metrics: [
      {
        id: "finance-01",
        name: "총 거래액 (GMV)",
        segment: "채널 / 카테고리 / 판매자별",
        definition: "할인 전 거래 총액",
        calc: "SUM(order_items.price × qty)",
        source: "DB orders, order_items",
        status: "db",
        direction: "higher",
      },
      {
        id: "finance-02",
        name: "실결제액",
        segment: "결제수단별",
        definition: "쿠폰·크레딧 차감 후 실제 결제된 금액",
        calc: "GMV − 쿠폰할인 − 크레딧사용",
        source: "DB payments",
        status: "db",
        direction: "higher",
      },
      {
        id: "finance-03",
        name: "객단가 (AOV)",
        segment: "채널 / 등급별",
        definition: "주문 1건당 평균 결제액",
        calc: "실결제액 ÷ 주문 수",
        source: "DB orders",
        status: "db",
        direction: "higher",
      },
      {
        id: "finance-04",
        name: "PG 수수료",
        segment: "결제수단별",
        definition: "결제수단 믹스에 따라 달라지는 원가",
        calc: "SUM(결제액 × 수단별 확정 요율)",
        source: "DB payments + 결제수단별 확정 요율(파메어스 토스 PG, 26년 7월 기준)",
        status: "db",
        direction: "lower",
      },
      {
        id: "finance-05",
        name: "정산 예정 · 완료 금액",
        segment: "판매자별 / 정산주기별",
        definition: "플랫폼이 지급해야 할 금액과 지급 완료분",
        calc: "SUM(settlements) BY status",
        source: "DB settlements",
        status: "db",
        direction: "higher",
      },
      {
        id: "finance-06",
        name: "플랫폼 수취액 (Take Rate)",
        segment: "카테고리별",
        definition: "GMV 중 플랫폼이 실제 남기는 비율. 사업 모델 건강도",
        calc: "(실결제액 − 정산금액 − PG수수료) ÷ GMV",
        source: "DB payments + settlements",
        status: "db",
        direction: "higher",
      },
      {
        id: "finance-07",
        name: "채널별 매출 구성",
        segment: "일반 / 미니샵 / 프로모션 / 추천",
        definition: "매출이 어느 경로에서 나오는가. 투자 배분 근거",
        calc: "채널별 실결제액 ÷ 전체 실결제액",
        source: "DB orders.channel — 채널 구분 컬럼 존재 여부 확인 필요",
        status: "db",
        direction: "higher",
      },
      {
        id: "finance-08",
        name: "크레딧 발행 · 소진 잔액",
        segment: "-",
        definition: "미소진 크레딧은 부채. 재무 리스크 관리",
        calc: "SUM(발행) − SUM(소진) − SUM(소멸)",
        source: "DB credits",
        status: "db",
        direction: "mixed",
      },
    ],
  },
  {
    slug: "system",
    idx: "08",
    name: "시스템 헬스",
    en: "HEALTH",
    question: "앱이 정상 동작하는가, 어떤 환경을 지원해야 하는가",
    metrics: [
      {
        id: "system-01",
        name: "크래시 건수 · 크래시프리율",
        segment: "iOS / AOS · 앱 버전별",
        definition: "크래시를 겪지 않은 유저 비율. 99.5% 미만이면 경고",
        calc: "(1 − 크래시 겪은 유저 ÷ 전체 유저) × 100",
        source: "Firebase Crashlytics — 연동 여부 확인 필요. GA4 app_exception으로 일부 대체 가능",
        status: "api",
        direction: "mixed",
      },
      {
        id: "system-02",
        name: "iOS / AOS 비중",
        segment: "-",
        definition: "플랫폼별 유저 분포. QA·개발 우선순위",
        calc: "플랫폼별 활성 유저 ÷ 전체",
        source: "GA4 자동 수집 (platform)",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "system-03",
        name: "상위 기종 Top 10",
        segment: "iOS / AOS 분리",
        definition: "QA 대상 단말 결정 근거",
        calc: "기종별 순 유저 수 내림차순",
        source: "GA4 자동 수집 (device.model)",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "system-04",
        name: "OS 버전 분포",
        segment: "iOS / AOS",
        definition: "최소 지원 버전 상향 판단 근거",
        calc: "OS 버전별 순 유저 비중",
        source: "GA4 자동 수집 (os_version)",
        status: "ga4",
        direction: "higher",
      },
      {
        id: "system-05",
        name: "앱 버전 분포 · 업데이트 확산율",
        segment: "-",
        definition: "신규 버전이 얼마나 빨리 퍼지는가. 강제 업데이트 판단",
        calc: "버전별 활성 유저 비중, 배포 후 일자별 추이",
        source: "GA4 자동 수집 (app_version)",
        status: "ga4",
        direction: "higher",
      },
    ],
  },
];

/** 전체 지표를 한 줄로 편다 — 검색·id 조회용 */
export const ALL_METRICS: (MetricDef & { layerSlug: string; layerName: string })[] =
  METRIC_LAYERS.flatMap((l) =>
    l.metrics.map((m) => ({ ...m, layerSlug: l.slug, layerName: l.name })),
  );

export function findMetric(id: string) {
  return ALL_METRICS.find((m) => m.id === id);
}

/**
 * 명시적 metricId 가 없는 서브 지표를 이름으로 찾는다.
 *
 * 같은 레이어(layerSlug) 안에서만 찾는다 — 다른 레이어의 "재구매율" 과
 * 이름이 겹칠 수 있어서다. 괄호 안 설명과 "…수" 같은 흔한 말미는 지우고
 * 비교한다 ("친구초대 코드 복사 수" ↔ "초대 코드 복사"). 결과가 하나로
 * 좁혀지지 않으면(0개나 2개 이상) 포기한다 — 잘못 짚는 것보다는 안 다는 게 낫다.
 */
function normalizeMetricName(s: string): string {
  return s
    .replace(/\s+/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/(를|을|의)$/g, "")
    .replace(/수$/, "");
}

export function findMetricByName(layerSlug: string, name: string): string | undefined {
  const target = normalizeMetricName(name);
  if (!target) return undefined;
  const hits = ALL_METRICS.filter(
    (m) => m.layerSlug === layerSlug && normalizeMetricName(m.name) === target,
  );
  return hits.length === 1 ? hits[0].id : undefined;
}

export function countByStatus(): Record<MetricStatus, number> {
  const out: Record<MetricStatus, number> = { ga4: 0, db: 0, api: 0, none: 0 };
  ALL_METRICS.forEach((m) => {
    out[m.status] += 1;
  });
  return out;
}
