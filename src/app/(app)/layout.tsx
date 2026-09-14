import Shell from "@/components/Shell";
import SignOutForm from "@/components/SignOutForm";
import { auth } from "@/auth";
import { authBypass } from "@/lib/auth-config";

/**
 * 로그인한 사람만 보는 화면들의 껍데기.
 *
 * 세션은 서버에서 한 번 읽어 Shell 에 넘긴다 — 클라이언트에서 다시 조회하면
 * 첫 화면에 사용자 이름이 비었다가 채워지는 깜빡임이 생긴다.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = authBypass ? null : await auth();

  return (
    <Shell
      user={
        session?.user
          ? { name: session.user.name ?? "사용자", email: session.user.email ?? "" }
          : null
      }
      signOut={<SignOutForm />}
    >
      {children}
    </Shell>
  );
}
