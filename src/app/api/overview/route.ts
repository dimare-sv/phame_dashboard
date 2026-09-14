import { NextResponse } from "next/server";
import { getDashboardSource, isPeriodKey } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const period = new URL(req.url).searchParams.get("period");
  if (!isPeriodKey(period)) {
    return NextResponse.json({ error: "period 는 d1 | d7 | d28 이어야 합니다." }, { status: 400 });
  }
  const data = await getDashboardSource().getOverview(period);
  return NextResponse.json(data);
}
