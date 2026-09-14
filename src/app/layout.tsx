import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { DashboardProvider } from "@/lib/dashboard-context";
import { SettingsProvider } from "@/lib/settings-context";
import { TooltipProvider } from "@/components/Tooltip";

/* 지표 번호·날짜·이벤트명처럼 자릿수가 맞아야 읽히는 것들에만 쓴다 */
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "파메 플랫폼 운영 대시보드",
  description: "기획팀용 플랫폼 총괄 KPI 대시보드",
};

/**
 * 껍데기만 둔다.
 * 레일과 상단바는 로그인한 화면에만 있으므로 (app) 레이아웃이 맡는다 —
 * 로그인 화면에 레일이 보이면 안 된다.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={mono.variable}>
      <body>
        <DashboardProvider>
          <SettingsProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </SettingsProvider>
        </DashboardProvider>
      </body>
    </html>
  );
}
