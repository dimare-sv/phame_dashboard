import { NextResponse } from "next/server";
import { getDashboardSource, isPeriodKey } from "@/lib/data";
import { isLens, type Lens } from "@/lib/segments";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const q = new URL(req.url).searchParams;
  const period = q.get("period");
  /* 관점이 없거나 이상하면 전체로 — 필터 하나 때문에 화면이 죽지 않게 한다 */
  const lensRaw = q.get("lens") ?? "all";
  const lens: Lens = isLens(lensRaw) ? lensRaw : "all";

  if (!isPeriodKey(period)) {
    return NextResponse.json({ error: "period 는 d1 | d7 | d28 이어야 합니다." }, { status: 400 });
  }

  const data = await getDashboardSource().getLayer(id, period, lens);
  if (!data) {
    return NextResponse.json({ error: `"${id}" 레이어는 아직 정의돼 있지 않습니다.` }, { status: 404 });
  }
  return NextResponse.json(data);
}
