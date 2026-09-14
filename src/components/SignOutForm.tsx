import { signOut } from "@/auth";

/**
 * 서버 액션으로 로그아웃한다.
 * 클라이언트에서 부르면 토큰을 만질 수 있어야 하는데, 그럴 이유가 없다.
 */
export default function SignOutForm() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button type="submit" className="signout">
        로그아웃
      </button>
    </form>
  );
}
