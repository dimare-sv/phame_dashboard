/**
 * 로그인 설정 상태.
 *
 * 미들웨어(엣지)와 서버 양쪽에서 읽으므로 무거운 것을 import 하지 않는다.
 */

/** 이 도메인 계정만 들어올 수 있다 */
export const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "pharmearth.kr";

export const authConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

/**
 * OAuth 값이 아직 없을 때 **개발 환경에서만** 로그인을 건너뛴다.
 *
 * 운영에서는 절대 열지 않는다 — 환경변수를 빠뜨린 채 배포하면 대시보드가
 * 통째로 공개되므로, 그 경우엔 열리는 대신 막히는 쪽이 맞다.
 */
export const authBypass = !authConfigured && process.env.NODE_ENV !== "production";
