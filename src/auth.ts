import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { ALLOWED_DOMAIN, authConfigured } from "@/lib/auth-config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: authConfigured
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          authorization: {
            params: {
              /* 회사 계정만 뜨게 하는 힌트. 강제력은 없으므로 아래에서 다시 본다 */
              hd: ALLOWED_DOMAIN,
              prompt: "select_account",
            },
          },
        }),
      ]
    : [],

  pages: { signIn: "/login", error: "/login" },

  /* 개발 편의를 위한 값이고, 운영에서 AUTH_SECRET 이 없으면 앱이 뜨지 않는다 */
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "dev-only-insecure-secret"),

  trustHost: true,

  callbacks: {
    /**
     * 도메인 검사는 **반드시 여기서** 한다.
     * 구글의 `hd` 파라미터는 계정 선택 화면의 힌트일 뿐이고,
     * 요청을 직접 만들면 우회된다.
     */
    signIn({ profile }) {
      const email = (profile?.email ?? "").toLowerCase();
      const verified = profile?.email_verified === true;
      return verified && email.endsWith(`@${ALLOWED_DOMAIN.toLowerCase()}`);
    },
  },
});
