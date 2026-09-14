import { signIn } from "@/auth";
import { ALLOWED_DOMAIN, authConfigured } from "@/lib/auth-config";

const ERROR_MESSAGE: Record<string, string> = {
  AccessDenied: `@${ALLOWED_DOMAIN} 계정만 들어올 수 있습니다. 회사 계정으로 다시 시도해 주세요.`,
  Configuration: "로그인 설정이 아직 완료되지 않았습니다. 관리자에게 알려주세요.",
  Verification: "인증 링크가 만료되었습니다. 다시 시도해 주세요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <main className="login">
      <div className="login-card">
        <div className="login-brand">
          <span className="mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 14 14">
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

        <h1>기획팀 전용입니다</h1>
        <p className="login-lead">
          <b>@{ALLOWED_DOMAIN}</b> 구글 계정으로 로그인하세요. 다른 도메인 계정은 로그인해도
          들어올 수 없습니다.
        </p>

        {error && (
          <p className="login-error">
            {ERROR_MESSAGE[error] ?? "로그인에 실패했습니다. 다시 시도해 주세요."}
          </p>
        )}

        {authConfigured ? (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: next || "/" });
            }}
          >
            <button type="submit" className="login-btn">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z"
                />
              </svg>
              Google 계정으로 로그인
            </button>
          </form>
        ) : (
          <div className="login-setup">
            <b>아직 로그인이 설정되지 않았습니다.</b>
            <p>
              Google Cloud 콘솔에서 OAuth 클라이언트를 만들고, 아래 환경변수를 채우면 이 화면에
              로그인 버튼이 생깁니다.
            </p>
            <pre>
              {`AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_SECRET=...
ALLOWED_EMAIL_DOMAIN=${ALLOWED_DOMAIN}`}
            </pre>
            <p className="dim">
              설정 전까지 개발 환경에서는 로그인 없이 대시보드가 열립니다. 운영 배포에서는
              환경변수가 없으면 아예 열리지 않습니다.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
