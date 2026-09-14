import { NextResponse } from "next/server";
import { getDashboardSource, isPeriodKey } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const period = new URL(req.url).searchParams.get("period");

  if (!isPeriodKey(period)) {
    return NextResponse.json({ error: "period 는 d1 | d7 | d28 이어야 합니다." }, { status: 400 });
  }

  const data = await getDashboardSource().getLayer(id, period);
  if (!data) {
    return NextResponse.json({ error: `"${id}" 레이어는 아직 정의돼 있지 않습니다.` }, { status: 404 });
  }
  return NextResponse.json(data);
}
