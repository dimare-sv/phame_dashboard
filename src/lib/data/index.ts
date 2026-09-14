import type { DashboardSource } from "./types";
import { mockSource } from "./adapters/mock";

/**
 * 데이터 소스 선택 지점.
 *
 * 화면은 절대 어댑터를 직접 import 하지 않는다. 항상 이 함수를 거친다.
 * GA4/DB 어댑터가 준비되면 여기에 case 를 하나 더 붙이는 것으로 교체가 끝난다 —
 * 화면 코드는 한 줄도 바뀌지 않는다.
 *
 * 이 모듈은 **서버 전용**이다. GA4 서비스 계정 키나 DB 접속 정보가
 * 클라이언트 번들에 실리면 안 되므로, 호출은 항상 app/api/* 라우트에서만 한다.
 */
export function getDashboardSource(): DashboardSource {
  const which = process.env.DATA_SOURCE ?? "mock";

  switch (which) {
    case "mock":
      return mockSource;

    // case "ga4":
    //   return ga4Source;   // GA4 Data API — user_id 전송 반영 후
    // case "db":
    //   return dbSource;    // PostgreSQL daily_metrics 집계 테이블

    default:
      throw new Error(
        `DATA_SOURCE="${which}" 는 아직 구현된 어댑터가 없습니다. 현재 가능: mock`,
      );
  }
}

export * from "./types";
