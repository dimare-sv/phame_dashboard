/**
 * 8개 레이어의 지표 명세 (더미).
 *
 * 여기 수치는 전부 예시다. 실어댑터가 붙으면 이 파일은 통째로 대체되지만,
 * **구조는 그대로 쓴다** — 레이어마다 무엇을 메인으로 두고 어떤 축으로 쪼갤지가
 * 이 파일의 실제 내용이고, 그건 데이터 출처가 바뀌어도 변하지 않는다.
 */
import type { LayerSpec } from "./build";

const STOCK_CAVEAT =
  "<b>이 조합은 선행 조건이 있습니다.</b> 누적 회원을 유입채널로 쪼개려면 " +
  "<b>가입 시점의 유입채널이 users 테이블에 컬럼으로 저장</b>돼 있어야 합니다. " +
  "GA4 세션 귀속만으로는 무료 티어 사용자 단위 보존 한도(최대 14개월)를 넘은 회원의 채널이 사라집니다. " +
  "아래 수치는 저장이 된다는 가정하의 예시입니다 — <b>현재 저장 여부 확인 필요</b>.";

const WEB_CRASH_CAVEAT =
  "<b>Web 의 0은 '크래시가 없다'가 아니라 '측정하지 않는다'입니다.</b> " +
  "웹에는 크래시 수집이 붙어 있지 않아 발생 건수를 알 수 없습니다. " +
  "이 분해는 <b>앱 두 플랫폼 사이의 비교</b>로만 읽어야 합니다.";

/** 활성 유저는 기간마다 모수가 바뀐다 — 어제는 DAU, 7일은 WAU, 28일은 MAU */
const ACTIVE_USERS: [number, number, number] = [4120, 12480, 39980];

export const LAYER_SPECS: LayerSpec[] = [
  /* ================================ 01 획득 ================================ */
  {
    id: "acq",
    idx: "01",
    title: "획득",
    eyebrow: "신규 가입자",
    define: "가입 완료 기준 · sign_up",
    metricId: "acq-01",
    mainUnit: "명",
    mainDecimals: 0,
    main: { name: "신규 가입자", kind: "count", unit: "명", v: 1204, flow: true, d: [12.4, 9.8, 14.2] },
    footer: [
      { k: "누적 회원", fixed: "24,180명" },
      {
        k: "순 증감",
        m: { name: "순 증감", kind: "count", unit: "명", v: 1061, flow: true, d: [11.8, 9.2, 13.6], prefix: "+" },
      },
    ],
    subs: [
      { name: "가입 전환율", kind: "rate", v: 62.4, vp: [63.1, 62.4, 61.0], d: [2.2, 1.8, 3.6] },
      { name: "SNS 간편가입 비중", kind: "rate", v: 71.2, vp: [72.5, 71.2, 69.8], d: [1.8, 3.4, 5.1] },
      { name: "해외 가입 비중", kind: "rate", v: 8.6, vp: [9.3, 8.6, 7.9], d: [0.7, 1.1, 2.3] },
      { name: "판매자 전환 신청", kind: "count", unit: "건", v: 48, flow: true, d: [14.3, 14.3, 22.5] },
      { name: "초대 코드 복사", kind: "count", unit: "건", v: 312, flow: true, d: [4.4, 6.2, 18.1] },
    ],
    targets: [
      { id: "signup", label: "신규 가입자", unit: "명", v: 1204, flow: true },
      { id: "member", label: "누적 회원", unit: "명", v: 24180, fixedPeriod: true },
    ],
    axes: [
      {
        id: "ch",
        label: "유입채널",
        items: ["자연유입", "추천인", "검색광고", "SNS광고", "기타"],
        ratios: {
          signup: [0.342, 0.264, 0.196, 0.131, 0.067],
          member: [0.38, 0.245, 0.18, 0.132, 0.063],
        },
        d: [4.2, 12.8, -3.1, 6.4, 1.2],
        caveats: { member: STOCK_CAVEAT },
      },
      {
        id: "signup",
        label: "가입방식",
        items: ["카카오", "애플", "네이버", "이메일"],
        ratios: {
          signup: [0.502, 0.21, 0.166, 0.122],
          member: [0.49, 0.208, 0.179, 0.123],
        },
        d: [8.1, 5.2, 2.4, -6.8],
      },
      {
        id: "geo",
        label: "지역",
        items: ["국내", "미국", "일본", "중국", "기타"],
        ratios: {
          signup: [0.914, 0.031, 0.026, 0.017, 0.012],
          member: [0.916, 0.032, 0.026, 0.017, 0.009],
        },
        d: [8.6, 22.4, 18.1, 4.2, 9.0],
      },
      {
        id: "grade",
        label: "등급",
        items: ["파머", "파머셀러", "프리마스터", "마스터", "파매니악"],
        ratios: {
          signup: [0.98, 0.02, 0, 0, 0],
          member: [0.8024, 0.1315, 0.0405, 0.0221, 0.0035],
        },
        d: [9.2, 8.4, 3.1, 1.2, 12.0],
        ordinal: true,
      },
    ],
    extra: {
      title: "등급 승급 처리 현황",
      note: "신청 → 관리자 승인 구조",
      showOnAxis: "grade",
      head: ["승급 경로", "신청", "승인", "반려", "대기", "승인율", "평균 소요"],
      cols: [
        { kind: "count", unit: "", flow: true },
        { kind: "count", unit: "", flow: true },
        { kind: "count", unit: "", flow: true },
        { kind: "count", unit: "", flow: true },
        { kind: "rate" },
        { kind: "days" },
      ],
      rows: [
        ["파머 → 파머셀러", 142, 118, 18, 6, 86.8, 1.8],
        ["파머셀러 → 프리마스터", 38, 29, 6, 3, 82.9, 2.4],
        ["프리마스터 → 마스터", 14, 9, 3, 2, 75.0, 3.1],
        ["마스터 → 파매니악", 3, 1, 1, 1, 50.0, 5.2],
      ],
      total: true,
      hot: { col: 3, min: 5 },
      footnote:
        "승급은 <b>신청 → 관리자 승인</b> 구조라 <b>대기 {3}건</b>이 공급 측 성장의 병목이 됩니다. " +
        "상위 등급일수록 승인율이 낮고 소요일이 길어집니다.",
    },
  },

  /* ================================ 02 활성 ================================ */
  {
    id: "active",
    idx: "02",
    title: "활성",
    eyebrow: "기능 활성률",
    define: "활성 유저 중 핵심 기능을 1개 이상 쓴 비율 · L3",
    metricId: "active-01",
    mainUnit: "%",
    mainDecimals: 1,
    main: { name: "기능 활성률", kind: "rate", v: 67.2, vp: [68.4, 67.2, 65.8], d: [1.2, 0.8, 2.4] },
    footer: [
      { k: "활성 유저", m: { name: "활성 유저", kind: "count", unit: "명", v: 12480, vp: ACTIVE_USERS, d: [3.1, 8.2, 11.6] } },
      { k: "Stickiness", m: { name: "Stickiness", kind: "rate", v: 31.2, vp: [30.4, 31.2, 31.9], d: [0.4, 0.8, 1.2] } },
    ],
    subs: [
      { name: "DAU", kind: "count", unit: "명", v: 4180, vp: [4120, 4180, 4260], d: [3.1, 2.4, 6.8] },
      { name: "평균 세션", kind: "sec", v: 484, vp: [492, 484, 478], d: [-1.6, -2.1, -3.4] },
      { name: "세션당 화면 수", kind: "num1", v: 12.4, vp: [12.8, 12.4, 12.1], d: [1.4, 0.8, 2.2] },
      { name: "피드 조회", kind: "count", unit: "회", v: 38240, flow: true, d: [8.2, 11.4, 19.6] },
      { name: "배너 클릭률", kind: "rate", v: 2.4, vp: [2.6, 2.4, 2.2], d: [0.2, 0.1, -0.3] },
    ],
    targets: [
      { id: "users", label: "활성 유저", unit: "명", v: 12480, vp: ACTIVE_USERS },
      { id: "session", label: "세션", unit: "건", v: 86400, flow: true },
    ],
    axes: [
      {
        id: "feat",
        label: "기능영역",
        items: ["홈", "피드", "미니샵", "채팅", "검색"],
        ratios: {
          users: [0.284, 0.246, 0.198, 0.152, 0.12],
          session: [0.312, 0.228, 0.186, 0.148, 0.126],
        },
        d: [4.2, 12.8, 6.4, 9.1, -2.4],
      },
      {
        id: "plat",
        label: "플랫폼",
        items: ["iOS", "Android", "Web"],
        ratios: {
          users: [0.421, 0.468, 0.111],
          session: [0.408, 0.472, 0.12],
        },
        d: [6.2, 8.4, -1.2],
      },
      {
        id: "time",
        label: "시간대",
        items: ["오전", "오후", "저녁", "심야"],
        ratios: {
          users: [0.182, 0.264, 0.386, 0.168],
          session: [0.174, 0.258, 0.398, 0.17],
        },
        d: [2.1, 4.6, 9.8, 12.4],
        ordinal: true,
      },
      {
        id: "seg",
        label: "유저 구분",
        items: ["신규", "복귀", "유지"],
        ratios: {
          users: [0.22, 0.16, 0.62],
          session: [0.184, 0.142, 0.674],
        },
        d: [9.8, 6.2, 7.4],
      },
    ],
    extra: {
      title: "기능영역별 체류와 이탈",
      note: "진입 대비 이탈",
      showOnAxis: "feat",
      head: ["화면", "진입", "평균 체류", "이탈률"],
      cols: [{ kind: "count", unit: "회", flow: true }, { kind: "sec" }, { kind: "rate" }],
      rows: [
        ["홈", 42800, 96, 18.2],
        ["피드", 37100, 214, 24.6],
        ["미니샵", 29800, 168, 31.4],
        ["채팅", 22900, 302, 12.8],
        ["검색", 18100, 74, 42.1],
      ],
      total: true,
      hot: { col: 2, min: 40 },
      footnote:
        "<b>검색</b>의 이탈률이 가장 높습니다. 검색 결과 없음 비율(17.2%)과 함께 보면 " +
        "화면 문제가 아니라 <b>상품 수급</b> 문제로 읽힙니다.",
    },
  },

  /* ================================ 03 전환 ================================ */
  {
    id: "convert",
    idx: "03",
    title: "전환",
    eyebrow: "구매 전환율",
    define: "방문 대비 결제 완료 · purchase",
    metricId: "convert-02",
    mainUnit: "%",
    mainDecimals: 1,
    main: {
      name: "구매 전환율",
      kind: "rate",
      v: 2.9,
      vp: [2.8, 2.9, 3.0],
      d: [-0.4, -0.3, 0.1],
    },
    footer: [
      { k: "주문 건수", m: { name: "주문 건수", kind: "count", unit: "건", v: 6510, flow: true, d: [8.2, 9.1, 13.4] } },
      { k: "객단가", m: { name: "객단가", kind: "num1", unit: "만원", v: 20.6, vp: [20.1, 20.6, 21.2], d: [1.2, 0.8, 2.4] } },
    ],
    subs: [
      { name: "장바구니 전환율", kind: "rate", v: 30.0, vp: [30.0, 30.0, 29.0], d: [-1.2, -0.8, -1.6] },
      { name: "결제 진입률", kind: "rate", v: 57.0, vp: [57.0, 57.0, 58.0], d: [0.4, -0.2, 1.1] },
      { name: "결제 완료율", kind: "rate", v: 79.0, vp: [79.0, 79.0, 80.0], d: [-0.6, -0.4, 0.8] },
      { name: "결제 실패율", kind: "rate", v: 3.0, vp: [3.2, 3.0, 2.9], d: [0.3, 0.2, -0.2], up: false },
      { name: "재구매율", kind: "rate", v: 24.8, vp: [24.2, 24.8, 25.6], d: [1.1, 1.4, 2.8] },
    ],
    targets: [
      { id: "order", label: "주문 건수", unit: "건", v: 6510, flow: true },
      { id: "attempt", label: "결제 시도", unit: "건", v: 8240, flow: true },
    ],
    axes: [
      {
        id: "pay",
        label: "결제수단",
        items: ["카드", "간편결제", "계좌이체", "가상계좌"],
        ratios: {
          order: [0.382, 0.446, 0.102, 0.07],
          attempt: [0.374, 0.438, 0.112, 0.076],
        },
        d: [2.4, 14.2, -3.8, -6.1],
      },
      {
        id: "entry",
        label: "유입경로",
        items: ["검색", "피드", "미니샵", "채팅", "프로모션"],
        ratios: {
          order: [0.284, 0.226, 0.198, 0.142, 0.15],
          attempt: [0.292, 0.232, 0.19, 0.136, 0.15],
        },
        d: [-2.1, 12.4, 6.8, 18.2, 4.1],
      },
      {
        id: "price",
        label: "가격대",
        items: ["3만원 미만", "3~10만원", "10~30만원", "30만원 이상"],
        ratios: {
          order: [0.284, 0.382, 0.242, 0.092],
          attempt: [0.296, 0.378, 0.238, 0.088],
        },
        d: [-1.2, 4.6, 11.2, 18.4],
        ordinal: true,
      },
      {
        id: "plat",
        label: "플랫폼",
        items: ["iOS", "Android", "Web"],
        ratios: {
          order: [0.446, 0.412, 0.142],
          attempt: [0.438, 0.424, 0.138],
        },
        d: [6.8, 4.2, -2.4],
      },
    ],
    extra: {
      title: "결제 실패 사유",
      note: "재시도로 회복되는지가 관건",
      head: ["사유", "건수", "비중", "재시도 성공률"],
      cols: [{ kind: "count", unit: "건", flow: true }, { kind: "rate" }, { kind: "rate" }],
      rows: [
        ["한도 초과", 70, 28.4, 42.1],
        ["카드 오류", 61, 24.6, 61.4],
        ["인증 실패", 49, 19.8, 78.2],
        ["잔액 부족", 41, 16.4, 38.6],
        ["기타", 26, 10.8, 24.1],
      ],
      total: true,
      hot: { col: 0, min: 60 },
      footnote:
        "결제 실패 <b>{0}건</b> 중 인증 실패는 재시도로 대부분 회복되지만, " +
        "<b>한도 초과·잔액 부족</b>은 회복률이 낮아 사실상 이탈입니다.",
    },
  },

  /* ================================ 04 유지 ================================ */
  {
    id: "retain",
    idx: "04",
    title: "유지",
    eyebrow: "D7 리텐션",
    define: "가입 7일 후 재방문한 비율",
    metricId: "retain-01",
    mainUnit: "%",
    mainDecimals: 1,
    main: { name: "D7 리텐션", kind: "rate", v: 33.8, vp: [34.2, 33.8, 33.1], d: [1.8, 1.2, 2.4] },
    footer: [
      { k: "D1 리텐션", m: { name: "D1", kind: "rate", v: 41.2, vp: [41.8, 41.2, 40.4], d: [1.2, 0.8, 1.9] } },
      { k: "D30 리텐션", m: { name: "D30", kind: "rate", v: 15.4, vp: [15.8, 15.4, 14.8], d: [0.6, 0.4, 1.2] } },
    ],
    subs: [
      { name: "D1 리텐션", kind: "rate", v: 41.2, vp: [41.8, 41.2, 40.4], d: [1.2, 0.8, 1.9] },
      { name: "D30 리텐션", kind: "rate", v: 15.4, vp: [15.8, 15.4, 14.8], d: [0.6, 0.4, 1.2] },
      { name: "이탈 위험군", kind: "count", unit: "명", v: 1840, vp: [1780, 1840, 1960], d: [-2.4, -1.8, 3.2], up: false },
      { name: "복귀 유저", kind: "count", unit: "명", v: 1990, flow: true, d: [4.2, 6.8, 11.4] },
      { name: "평균 방문 주기", kind: "days", v: 4.2, vp: [4.0, 4.2, 4.5], d: [-0.2, -0.1, 0.3], up: false },
    ],
    targets: [
      { id: "cohort", label: "가입 코호트", unit: "명", v: 1204, flow: true },
      { id: "active", label: "활성 유저", unit: "명", v: 12480, vp: ACTIVE_USERS },
    ],
    axes: [
      {
        id: "ch",
        label: "유입채널",
        items: ["자연유입", "추천인", "검색광고", "SNS광고", "기타"],
        ratios: {
          cohort: [0.342, 0.264, 0.196, 0.131, 0.067],
          active: [0.368, 0.252, 0.184, 0.132, 0.064],
        },
        d: [4.2, 12.8, -3.1, 6.4, 1.2],
        caveats: { active: STOCK_CAVEAT },
      },
      {
        id: "first",
        label: "첫 구매 여부",
        items: ["첫 구매 완료", "첫 구매 미완료"],
        ratios: {
          cohort: [0.186, 0.814],
          active: [0.412, 0.588],
        },
        d: [14.2, -2.4],
      },
      {
        id: "signup",
        label: "가입방식",
        items: ["카카오", "애플", "네이버", "이메일"],
        ratios: {
          cohort: [0.502, 0.21, 0.166, 0.122],
          active: [0.486, 0.216, 0.174, 0.124],
        },
        d: [8.1, 5.2, 2.4, -6.8],
      },
      {
        id: "grade",
        label: "등급",
        items: ["파머", "파머셀러", "프리마스터", "마스터", "파매니악"],
        ratios: {
          cohort: [0.98, 0.02, 0, 0, 0],
          active: [0.742, 0.168, 0.056, 0.029, 0.005],
        },
        d: [9.2, 8.4, 3.1, 1.2, 12.0],
        ordinal: true,
      },
    ],
    extra: {
      title: "이탈 위험군 세그먼트",
      note: "어디서 멈췄는지로 나눈다",
      head: ["세그먼트", "인원", "마지막 방문", "복귀율"],
      cols: [{ kind: "count", unit: "명", flow: true }, { kind: "days" }, { kind: "rate" }],
      rows: [
        ["가입 후 미구매", 862, 12.4, 8.2],
        ["1회 구매 후 이탈", 524, 18.6, 14.6],
        ["장기 미방문 (30일+)", 296, 42.1, 4.8],
        ["장바구니 방치", 158, 6.2, 28.4],
      ],
      total: true,
      hot: { col: 1, min: 30 },
      footnote:
        "<b>가입 후 미구매</b>가 이탈 위험군의 절반입니다 — 유지의 관문은 재방문이 아니라 <b>첫 구매</b>입니다.",
    },
  },

  /* ================================ 05 공급 ================================ */
  {
    id: "supply",
    idx: "05",
    title: "공급",
    eyebrow: "미니샵 활성률",
    define: "최근 30일 내 주문이 1건 이상 발생한 미니샵 비율",
    metricId: "supply-02",
    mainUnit: "%",
    mainDecimals: 1,
    main: {
      name: "미니샵 활성률",
      kind: "rate",
      v: 42.6,
      vp: [41.5, 42.6, 43.8],
      d: [-2.1, -1.4, -0.9],
    },
    footer: [
      { k: "전체 미니샵", fixed: "1,284개" },
      { k: "신규 개설", m: { name: "신규 개설", kind: "count", unit: "개", v: 38, flow: true, d: [8.6, 12.4, 18.2] } },
    ],
    subs: [
      { name: "신규 미니샵", kind: "count", unit: "개", v: 38, flow: true, d: [8.6, 12.4, 18.2] },
      { name: "첫 주문 전환", kind: "rate", v: 23.7, vp: [22.4, 23.7, 25.1], d: [-1.8, -1.2, 0.6] },
      { name: "상품 등록", kind: "count", unit: "건", v: 412, flow: true, d: [6.4, 9.8, 14.2] },
      { name: "판매자 응답률", kind: "rate", v: 87.4, vp: [86.8, 87.4, 88.1], d: [-0.4, 0.6, 1.4] },
      { name: "재고 소진 상품", kind: "count", unit: "건", v: 64, flow: true, d: [12.4, 8.6, -4.2], up: false },
    ],
    targets: [
      { id: "shop", label: "미니샵", unit: "개", v: 1284, fixedPeriod: true },
      { id: "item", label: "등록 상품", unit: "개", v: 18420, fixedPeriod: true },
    ],
    axes: [
      {
        id: "cat",
        label: "카테고리",
        items: ["스킨케어", "메이크업", "헤어", "바디", "기기"],
        ratios: {
          shop: [0.342, 0.246, 0.164, 0.142, 0.106],
          item: [0.386, 0.268, 0.142, 0.128, 0.076],
        },
        d: [4.2, 6.8, -1.2, 8.4, 12.6],
      },
      {
        id: "grade",
        label: "판매자 등급",
        items: ["파머셀러", "프리마스터", "마스터", "파매니악"],
        ratios: {
          shop: [0.642, 0.216, 0.112, 0.03],
          item: [0.418, 0.284, 0.218, 0.08],
        },
        d: [8.4, 3.1, 1.2, 12.0],
        ordinal: true,
      },
      {
        id: "age",
        label: "개설 기간",
        items: ["1개월 미만", "1~3개월", "3~6개월", "6개월 이상"],
        ratios: {
          shop: [0.118, 0.224, 0.286, 0.372],
          item: [0.064, 0.168, 0.272, 0.496],
        },
        d: [12.4, 6.2, -1.4, 2.8],
        ordinal: true,
      },
      {
        id: "geo",
        label: "지역",
        items: ["수도권", "영남", "충청", "호남", "기타"],
        ratios: {
          shop: [0.512, 0.186, 0.124, 0.108, 0.07],
          item: [0.548, 0.174, 0.118, 0.098, 0.062],
        },
        d: [6.2, 4.1, 2.8, 1.4, 8.6],
      },
    ],
    extra: {
      title: "카테고리별 수급 현황",
      note: "수요가 있는데 상품이 없는 칸을 찾는다",
      showOnAxis: "cat",
      head: ["카테고리", "미니샵", "상품", "검색 무결과율", "재고 소진"],
      cols: [
        { kind: "count", unit: "개", sum: true },
        { kind: "count", unit: "개", sum: true },
        { kind: "rate" },
        { kind: "count", unit: "건", flow: true },
      ],
      rows: [
        ["스킨케어", 439, 7110, 12.4, 22],
        ["메이크업", 316, 4937, 14.8, 18],
        ["헤어", 211, 2616, 21.6, 12],
        ["바디", 182, 2358, 18.2, 8],
        ["기기", 136, 1399, 28.4, 4],
      ],
      total: true,
      hot: { col: 2, min: 20 },
      footnote:
        "<b>기기</b>와 <b>헤어</b>는 검색 무결과율이 20%를 넘습니다 — 찾는 사람은 있는데 <b>물건이 없다</b>는 뜻입니다.",
    },
  },

  /* ============================= 06 신뢰·품질 ============================= */
  {
    id: "trust",
    idx: "06",
    title: "신뢰·품질",
    eyebrow: "CS 첫응답 시간",
    define: "문의 접수 → 첫 응답까지 · 영업시간 기준",
    metricId: "trust-06",
    mainUnit: "분",
    mainDecimals: 0,
    main: {
      name: "CS 첫응답 시간",
      kind: "min",
      v: 18,
      vp: [14, 18, 22],
      d: [-2, 3, 5],
      up: false,
    },
    footer: [
      { k: "미처리 문의", m: { name: "미처리", kind: "count", unit: "건", v: 84, vp: [84, 84, 84], d: [6.2, 12.4, 18.6], up: false } },
      { k: "평균 해결 시간", m: { name: "해결", kind: "hour", v: 4.2, vp: [3.8, 4.2, 4.8], d: [-0.2, 0.4, 0.9], up: false } },
    ],
    subs: [
      { name: "문의 건수", kind: "count", unit: "건", v: 1284, flow: true, d: [6.2, 8.4, 12.6], up: false },
      { name: "해결률", kind: "rate", v: 92.4, vp: [93.1, 92.4, 91.2], d: [0.8, -0.6, -1.4] },
      { name: "후기 작성률", kind: "rate", v: 18.6, vp: [19.2, 18.6, 17.8], d: [0.6, 1.2, 2.4] },
      { name: "평균 별점", kind: "score", v: 4.32, vp: [4.34, 4.32, 4.28], d: [0.02, 0.01, -0.03] },
      { name: "신고 접수", kind: "count", unit: "건", v: 23, flow: true, d: [-8.4, 4.2, 14.6], up: false },
    ],
    targets: [
      { id: "inquiry", label: "문의", unit: "건", v: 1284, flow: true },
      { id: "pending", label: "미처리 문의", unit: "건", v: 84, fixedPeriod: true },
    ],
    axes: [
      {
        id: "type",
        label: "문의 유형",
        items: ["배송", "환불", "상품", "결제", "기타"],
        ratios: {
          inquiry: [0.286, 0.242, 0.198, 0.164, 0.11],
          pending: [0.226, 0.318, 0.164, 0.202, 0.09],
        },
        d: [4.2, 12.8, -2.1, 8.4, 1.2],
        up: false,
      },
      {
        id: "ch",
        label: "채널",
        items: ["채팅", "이메일", "전화"],
        ratios: {
          inquiry: [0.684, 0.212, 0.104],
          pending: [0.612, 0.286, 0.102],
        },
        d: [8.4, -2.1, -6.2],
        up: false,
      },
      {
        id: "time",
        label: "접수 시간대",
        items: ["오전", "오후", "저녁", "심야"],
        ratios: {
          inquiry: [0.242, 0.318, 0.286, 0.154],
          pending: [0.186, 0.284, 0.324, 0.206],
        },
        d: [2.1, 4.6, 9.8, 12.4],
        up: false,
        ordinal: true,
      },
      {
        id: "plat",
        label: "플랫폼",
        items: ["iOS", "Android", "Web"],
        ratios: {
          inquiry: [0.412, 0.468, 0.12],
          pending: [0.398, 0.482, 0.12],
        },
        d: [4.2, 9.6, -1.2],
        up: false,
      },
    ],
    extra: {
      title: "문의 유형별 처리 현황",
      note: "느린 유형이 곧 미처리로 쌓인다",
      showOnAxis: "type",
      head: ["유형", "접수", "처리", "미처리", "첫 응답", "해결 시간"],
      cols: [
        { kind: "count", unit: "건", flow: true },
        { kind: "count", unit: "건", flow: true },
        { kind: "count", unit: "건", sum: true },
        { kind: "min" },
        { kind: "hour" },
      ],
      rows: [
        ["배송", 367, 348, 19, 12, 2.8],
        ["환불", 311, 284, 27, 24, 6.4],
        ["상품", 254, 240, 14, 16, 3.6],
        ["결제", 211, 194, 17, 21, 5.2],
        ["기타", 141, 134, 7, 14, 3.1],
      ],
      total: true,
      hot: { col: 3, min: 20 },
      footnote:
        "<b>환불</b>이 첫 응답도 가장 늦고 해결도 가장 오래 걸립니다 — 미처리 <b>{2}건</b>의 상당수가 여기서 나옵니다.",
    },
  },

  /* ================================ 07 재무 ================================ */
  {
    id: "finance",
    idx: "07",
    title: "재무",
    eyebrow: "GMV",
    define: "취소·환불 차감 전 총 거래액",
    metricId: "finance-01",
    mainUnit: "억",
    mainDecimals: 1,
    main: { name: "GMV", kind: "eok", v: 13.4, flow: true, d: [9.3, 9.3, 12.7] },
    footer: [
      { k: "연 누계", fixed: "189.4억" },
      { k: "순매출", m: { name: "순매출", kind: "eok", v: 1.94, flow: true, d: [9.4, 9.3, 12.8] } },
    ],
    subs: [
      { name: "주문 건수", kind: "count", unit: "건", v: 6510, flow: true, d: [8.2, 9.1, 13.4] },
      { name: "객단가", kind: "num1", unit: "만원", v: 20.6, vp: [20.1, 20.6, 21.2], d: [1.2, 0.8, 2.4] },
      { name: "취소·환불률", kind: "rate", v: 4.8, vp: [5.1, 4.8, 4.6], d: [0.4, -0.2, -0.6], up: false },
      { name: "수수료 수익", kind: "eok", v: 1.34, flow: true, d: [9.4, 9.3, 12.8] },
      { name: "쿠폰 사용액", kind: "eok", v: 0.42, flow: true, d: [14.2, 18.6, 24.1], up: false },
    ],
    targets: [
      { id: "gmv", label: "거래액", unit: "만원", v: 134000, flow: true },
      { id: "order", label: "주문 건수", unit: "건", v: 6510, flow: true },
    ],
    axes: [
      {
        id: "cat",
        label: "카테고리",
        items: ["스킨케어", "메이크업", "헤어", "바디", "기기"],
        ratios: {
          gmv: [0.386, 0.248, 0.142, 0.118, 0.106],
          order: [0.412, 0.286, 0.132, 0.108, 0.062],
        },
        d: [8.2, 12.4, -2.1, 6.8, 18.6],
      },
      {
        id: "price",
        label: "가격대",
        items: ["3만원 미만", "3~10만원", "10~30만원", "30만원 이상"],
        ratios: {
          gmv: [0.086, 0.284, 0.382, 0.248],
          order: [0.284, 0.382, 0.242, 0.092],
        },
        d: [-1.2, 4.6, 11.2, 18.4],
        ordinal: true,
      },
      {
        id: "pay",
        label: "결제수단",
        items: ["카드", "간편결제", "계좌이체", "가상계좌"],
        ratios: {
          gmv: [0.412, 0.418, 0.102, 0.068],
          order: [0.382, 0.446, 0.102, 0.07],
        },
        d: [2.4, 14.2, -3.8, -6.1],
      },
      {
        id: "plat",
        label: "플랫폼",
        items: ["iOS", "Android", "Web"],
        ratios: {
          gmv: [0.462, 0.398, 0.14],
          order: [0.446, 0.412, 0.142],
        },
        d: [8.4, 6.2, -1.8],
      },
    ],
    extra: {
      title: "카테고리별 거래 현황",
      note: "객단가와 환불률을 같이 본다",
      showOnAxis: "cat",
      head: ["카테고리", "거래액", "주문", "객단가", "환불률"],
      cols: [
        { kind: "eok", flow: true },
        { kind: "count", unit: "건", flow: true },
        { kind: "num1", unit: "만원" },
        { kind: "rate" },
      ],
      rows: [
        ["스킨케어", 5.17, 2682, 19.3, 4.2],
        ["메이크업", 3.32, 1862, 17.8, 5.6],
        ["헤어", 1.9, 859, 22.1, 3.8],
        ["바디", 1.58, 703, 22.5, 4.1],
        ["기기", 1.42, 404, 35.1, 8.4],
      ],
      total: true,
      hot: { col: 3, min: 6 },
      footnote:
        "<b>기기</b>는 객단가가 가장 높지만 환불률도 가장 높습니다 — 거래액 <b>{0}</b> 중 " +
        "실제로 남는 몫은 카테고리마다 다릅니다.",
    },
  },

  /* ================================ 08 시스템 ================================ */
  {
    id: "system",
    idx: "08",
    title: "시스템",
    eyebrow: "크래시프리율",
    define: "크래시 없이 세션을 마친 비율",
    metricId: "system-01",
    mainUnit: "%",
    mainDecimals: 2,
    main: { name: "크래시프리율", kind: "rate2", v: 99.66, vp: [99.62, 99.66, 99.71], d: [-0.08, -0.04, 0.03] },
    footer: [
      { k: "크래시 발생", m: { name: "크래시", kind: "count", unit: "건", v: 42, flow: true, d: [12.4, 8.6, -6.2], up: false } },
      { k: "영향 유저", m: { name: "영향 유저", kind: "count", unit: "명", v: 38, flow: true, d: [11.2, 7.4, -5.8], up: false } },
    ],
    subs: [
      { name: "ANR율", kind: "rate2", v: 0.12, vp: [0.14, 0.12, 0.1], d: [0.02, 0.01, -0.02], up: false },
      { name: "앱 시작 시간", kind: "num1", unit: "초", v: 1.8, vp: [1.9, 1.8, 1.8], d: [0.1, -0.1, -0.2], up: false },
      { name: "API 오류율", kind: "rate2", v: 0.34, vp: [0.38, 0.34, 0.31], d: [0.04, -0.02, -0.06], up: false },
      { name: "최신 버전 비중", kind: "rate", v: 78.2, vp: [76.4, 78.2, 74.6], d: [1.8, 2.4, -1.2] },
      { name: "푸시 수신률", kind: "rate", v: 64.8, vp: [64.2, 64.8, 65.4], d: [-0.6, 0.4, 1.1] },
    ],
    targets: [
      { id: "crash", label: "크래시 발생", unit: "건", v: 42, flow: true },
      { id: "affected", label: "영향 유저", unit: "명", v: 38, flow: true },
    ],
    axes: [
      {
        id: "plat",
        label: "플랫폼",
        items: ["iOS", "Android", "Web"],
        ratios: {
          /* Web 은 크래시 수집 자체가 안 붙어 있어 0 이다 — 비중이 아니라 미계측 */
          crash: [0.362, 0.638, 0],
          affected: [0.368, 0.632, 0],
        },
        d: [-4.2, 8.6, 0],
        up: false,
        caveats: { crash: WEB_CRASH_CAVEAT, affected: WEB_CRASH_CAVEAT },
      },
      {
        id: "screen",
        label: "화면",
        items: ["홈", "미니샵", "결제", "채팅", "피드"],
        ratios: {
          crash: [0.142, 0.218, 0.324, 0.186, 0.13],
          affected: [0.146, 0.212, 0.318, 0.192, 0.132],
        },
        d: [-2.1, 6.4, 18.2, 4.6, -8.4],
        up: false,
      },
      {
        id: "ver",
        label: "앱 버전",
        items: ["2.4.1", "2.4.0", "2.3.x", "2.2 이하"],
        ratios: {
          crash: [0.186, 0.412, 0.284, 0.118],
          affected: [0.192, 0.404, 0.286, 0.118],
        },
        d: [12.4, 6.2, -8.4, -12.6],
        up: false,
        ordinal: true,
      },
      {
        id: "os",
        label: "OS 버전",
        items: ["최신", "최신-1", "최신-2", "그 이전"],
        ratios: {
          crash: [0.242, 0.318, 0.264, 0.176],
          affected: [0.248, 0.312, 0.262, 0.178],
        },
        d: [8.2, 4.1, -2.4, -6.8],
        up: false,
        ordinal: true,
      },
    ],
    extra: {
      title: "화면별 크래시",
      note: "발생량보다 어디서 나는지가 중요하다",
      showOnAxis: "screen",
      head: ["화면", "발생", "영향 유저", "세션 대비", "최근 발생"],
      cols: [
        { kind: "count", unit: "건", flow: true },
        { kind: "count", unit: "명", flow: true },
        { kind: "rate2" },
        { kind: "days" },
      ],
      rows: [
        ["결제", 14, 12, 0.18, 0.2],
        ["미니샵", 9, 8, 0.11, 0.4],
        ["채팅", 8, 7, 0.09, 1.1],
        ["홈", 6, 6, 0.04, 0.6],
        ["피드", 5, 5, 0.06, 2.4],
      ],
      total: true,
      hot: { col: 2, min: 0.15 },
      footnote:
        "크래시의 3분의 1이 <b>결제 화면</b>에서 납니다 — 건수는 적어도 매출에 직접 닿는 자리입니다. " +
        "최근 발생은 <b>일 전</b> 기준입니다.",
    },
  },
];
