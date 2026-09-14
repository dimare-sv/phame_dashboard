import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { authBypass, authConfigured } from "@/lib/auth-config";

export default auth((req) => {
  if (authBypass) return NextResponse.next();

  /* 운영에 환경변수를 빠뜨린 경우 — 열리는 대신 왜 안 되는지 말해준다 */
  if (!authConfigured) {
    return new NextResponse(
      "로그인이 설정되지 않아 대시보드를 열 수 없습니다.\n" +
        "AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET / AUTH_SECRET 환경변수를 설정하세요.",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  if (req.auth) return NextResponse.next();

  /**
   * API 는 로그인 화면 HTML 로 보내지 않고 401 을 준다.
   * 리다이렉트된 HTML 을 fetch 쪽에서 JSON 으로 파싱하면
   * "로그인이 풀렸다" 대신 엉뚱한 파싱 에러가 화면에 뜬다.
   */
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const url = new URL("/login", req.nextUrl.origin);
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
});

/**
 * 로그인 화면과 인증 콜백, 정적 파일을 빼고 **전부** 막는다.
 * 새 화면을 추가할 때 여기 손댈 일이 없도록 화이트리스트가 아니라 블랙리스트로 둔다.
 */
export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
};
